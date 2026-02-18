const DEFAULT_API_URL = "";

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(["apiBaseUrl"], (result) => {
    if (!result.apiBaseUrl) {
      chrome.storage.sync.set({ apiBaseUrl: DEFAULT_API_URL });
    }
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "ANALYZE_JOB") {
    chrome.storage.sync.get(["apiBaseUrl"], async (result) => {
      const baseUrl = result.apiBaseUrl || DEFAULT_API_URL;

      if (!baseUrl) {
        sendResponse({
          error: "No API URL configured. Click the extension icon to set your Ghost Job Detector URL.",
        });
        return;
      }

      try {
        const response = await fetch(`${baseUrl}/api/analyze`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(message.data),
        });

        if (!response.ok) {
          const errorText = await response.text();
          sendResponse({ error: `Server error (${response.status}): ${errorText}` });
          return;
        }

        const data = await response.json();
        sendResponse({ data });
      } catch (err) {
        sendResponse({ error: `Connection failed: ${err.message}` });
      }
    });

    return true;
  }
});
