const DEFAULT_API_URL = "https://ghostjobdetector.org";

const JOB_SITE_PATTERNS = [
  { host: "linkedin.com", pathIncludes: "/jobs/" },
  { host: "linkedin.com", pathIncludes: "/jobs?" },
  { host: "indeed.com", pathIncludes: "/viewjob" },
  { host: "indeed.com", pathIncludes: "/rc/clk" },
  { host: "indeed.com", pathIncludes: "/jobs" },
  { host: "glassdoor.com", pathIncludes: "/job-listing" },
  { host: "glassdoor.com", pathIncludes: "/Job" },
  { host: "glassdoor.com", pathIncludes: "/Jobs" },
  { host: "glassdoor.com", pathIncludes: "/job/" },
  { host: "glassdoor.com", pathIncludes: "/job-" },
  { host: "ziprecruiter.com", pathIncludes: "/jobs/" },
  { host: "ziprecruiter.com", pathIncludes: "/c/" },
  { host: "ziprecruiter.com", pathIncludes: "/job/" },
  { host: "ziprecruiter.com", pathIncludes: "/k/" },
  { host: "ziprecruiter.com", pathIncludes: "/ojob/" },
];

function isJobSiteUrl(url) {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    for (const pattern of JOB_SITE_PATTERNS) {
      if (parsed.hostname.includes(pattern.host) && parsed.pathname.includes(pattern.pathIncludes)) {
        return true;
      }
    }
  } catch {}
  return false;
}

function updateBadge(tabId, url) {
  if (isJobSiteUrl(url)) {
    chrome.action.setBadgeText({ text: "!", tabId });
    chrome.action.setBadgeBackgroundColor({ color: "#2563EB", tabId });
    chrome.action.setBadgeTextColor({ color: "#FFFFFF", tabId });
  } else {
    chrome.action.setBadgeText({ text: "", tabId });
  }
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(["apiBaseUrl"], (result) => {
    if (!result.apiBaseUrl) {
      chrome.storage.sync.set({ apiBaseUrl: DEFAULT_API_URL });
    }
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    updateBadge(tabId, tab.url);
    if (isJobSiteUrl(tab.url)) {
      ensureContentScript(tabId).catch(() => {});
    }
  }
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.url) {
      updateBadge(tab.id, tab.url);
    }
  } catch {}
});

function getApiBase() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(["apiBaseUrl"], (result) => {
      resolve(result.apiBaseUrl || DEFAULT_API_URL);
    });
  });
}

async function ensureContentScript(tabId) {
  try {
    await chrome.tabs.sendMessage(tabId, { type: "PING" });
    return true;
  } catch {
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ["content.js"],
      });
      return true;
    } catch (err) {
      console.error("Failed to inject content script:", err);
      return false;
    }
  }
}

async function scanTab(tabId) {
  try {
    const tab = await chrome.tabs.get(tabId);
    const url = tab.url || "";
    if (url.startsWith("chrome://") || url.startsWith("chrome-extension://") ||
        url.startsWith("about:") || url.startsWith("edge://") ||
        url.startsWith("brave://") || url === "" || url.startsWith("chrome-search://")) {
      return { error: "This is a browser internal page. Navigate to a job posting on LinkedIn, Indeed, Glassdoor, or ZipRecruiter and try again." };
    }

    const injected = await ensureContentScript(tabId);
    if (!injected) {
      return { error: "Cannot access this page. Make sure you're on a job posting page." };
    }

    let response = null;
    try {
      response = await chrome.tabs.sendMessage(tabId, { type: "SCAN_PAGE" });
    } catch {
      return { error: "Could not communicate with the page. Try refreshing the page and scanning again." };
    }

    if (!response || !response.ok) {
      return { error: "Could not extract job data from this page." };
    }

    const jobData = response.data;

    if (!jobData.title && !jobData.company && !jobData.description) {
      return { error: "No job posting data found on this page." };
    }

    const baseUrl = await getApiBase();
    if (!baseUrl) {
      return { error: "No API URL configured. Click the extension icon to set your Ghost Job Detector URL." };
    }

    const apiResponse = await fetch(`${baseUrl}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(jobData),
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      return { error: `Server error (${apiResponse.status}): ${errorText}` };
    }

    const data = await apiResponse.json();
    return { data };
  } catch (err) {
    return { error: `Analysis failed: ${err.message}` };
  }
}

async function checkIfJobPage(tabId) {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (isJobSiteUrl(tab.url)) return true;

    const injected = await ensureContentScript(tabId);
    if (!injected) return false;

    const response = await chrome.tabs.sendMessage(tabId, { type: "CHECK_JOB_PAGE" });
    return response?.isJobPage || false;
  } catch {
    return false;
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "ANALYZE_TAB") {
    const tabId = message.tabId;
    scanTab(tabId).then(sendResponse);
    return true;
  }

  if (message.type === "CHECK_JOB_PAGE") {
    const tabId = message.tabId;
    checkIfJobPage(tabId).then((isJobPage) => {
      sendResponse({ isJobPage });
    });
    return true;
  }

  if (message.type === "SCAN_FROM_FAB") {
    (async () => {
      try {
        const baseUrl = await getApiBase();
        if (!baseUrl) {
          sendResponse({ error: "No API URL configured. Open the extension popup to set your Ghost Job Detector URL." });
          return;
        }

        const jobData = message.jobData;
        if (!jobData || (!jobData.title && !jobData.company && !jobData.description)) {
          sendResponse({ error: "No job data found on this page." });
          return;
        }

        const apiResponse = await fetch(`${baseUrl}/api/analyze`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(jobData),
        });

        if (!apiResponse.ok) {
          const errorText = await apiResponse.text();
          sendResponse({ error: `Server error (${apiResponse.status}): ${errorText}` });
          return;
        }

        const data = await apiResponse.json();
        sendResponse({ data });
      } catch (err) {
        sendResponse({ error: `Analysis failed: ${err.message}` });
      }
    })();
    return true;
  }

  if (message.type === "JOB_PAGE_DETECTED") {
    if (sender.tab && sender.tab.id) {
      updateBadge(sender.tab.id, sender.tab.url);
    }
  }
});
