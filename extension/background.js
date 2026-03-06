const DEFAULT_API_URL = "https://ghost-job-detector.replit.app";

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

async function scanTab(tabId) {
  try {
    const [response] = await chrome.tabs.sendMessage(tabId, { type: "SCAN_PAGE" }).then(r => [r]).catch(() => [null]);

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
