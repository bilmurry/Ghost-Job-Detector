const DEFAULT_API_URL = "https://ghostjobdetector.org";

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(["apiBaseUrl"], (result) => {
    if (!result.apiBaseUrl) {
      chrome.storage.sync.set({ apiBaseUrl: DEFAULT_API_URL });
    }
  });
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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "ANALYZE_TAB") {
    const tabId = message.tabId;
    scanTab(tabId).then(sendResponse);
    return true;
  }
});
