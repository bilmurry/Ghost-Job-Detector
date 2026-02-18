const urlInput = document.getElementById("api-url");
const saveBtn = document.getElementById("save-btn");
const statusEl = document.getElementById("status");

chrome.storage.sync.get(["apiBaseUrl"], (result) => {
  if (result.apiBaseUrl) {
    urlInput.value = result.apiBaseUrl;
  }
});

saveBtn.addEventListener("click", () => {
  let url = urlInput.value.trim();

  if (!url) {
    statusEl.textContent = "Please enter a URL.";
    statusEl.className = "status error";
    return;
  }

  url = url.replace(/\/+$/, "");

  if (!url.startsWith("https://") && !url.startsWith("http://")) {
    statusEl.textContent = "URL must start with https:// or http://";
    statusEl.className = "status error";
    return;
  }

  chrome.storage.sync.set({ apiBaseUrl: url }, () => {
    statusEl.textContent = "Saved successfully.";
    statusEl.className = "status success";
    setTimeout(() => {
      statusEl.textContent = "";
      statusEl.className = "status";
    }, 2000);
  });
});
