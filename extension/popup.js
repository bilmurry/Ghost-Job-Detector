
function getRiskColor(level) {
  switch (level) {
    case "high": return "#EF4444";
    case "medium": return "#F59E0B";
    case "low-medium": return "#F97316";
    case "low": return "#10B981";
    default: return "#8B8D94";
  }
}

function getSeverityColor(severity) {
  switch (severity) {
    case "critical": return "#EF4444";
    case "high": return "#F59E0B";
    case "medium": return "#F97316";
    case "low": return "#10B981";
    default: return "#8B8D94";
  }
}

const scanBtn = document.getElementById("scan-btn");
const scanError = document.getElementById("scan-error");
const scanResult = document.getElementById("scan-result");
const resultScore = document.getElementById("result-score");
const resultRisk = document.getElementById("result-risk");
const resultRec = document.getElementById("result-rec");
const resultFlags = document.getElementById("result-flags");
const settingsToggle = document.getElementById("settings-toggle");
const settingsPanel = document.getElementById("settings-panel");
const urlInput = document.getElementById("api-url");
const saveBtn = document.getElementById("save-btn");
const statusEl = document.getElementById("status");

chrome.storage.sync.get(["apiBaseUrl"], (result) => {
  if (result.apiBaseUrl) {
    urlInput.value = result.apiBaseUrl;
  }
});

settingsToggle.addEventListener("click", () => {
  settingsPanel.classList.toggle("visible");
});

saveBtn.addEventListener("click", () => {
  let url = urlInput.value.trim();

  if (!url) {
    statusEl.textContent = "Please enter a URL.";
    statusEl.className = "status error";
    return;
  }

  url = url.replace(/\/+$/, "");

  if (!url.startsWith("https://")) {
    statusEl.textContent = "URL must start with https://";
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

scanBtn.addEventListener("click", async () => {
  scanBtn.disabled = true;
  scanBtn.textContent = "Analyzing…";
  scanError.classList.remove("visible");
  scanResult.classList.remove("visible");

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab || !tab.id) {
      throw new Error("No active tab found.");
    }

    const response = await chrome.runtime.sendMessage({
      type: "ANALYZE_TAB",
      tabId: tab.id,
    });

    if (response.error) {
      scanError.textContent = response.error;
      scanError.classList.add("visible");
      return;
    }

    const data = response.data;
    const riskColor = getRiskColor(data.riskLevel);

    resultScore.textContent = data.ghostScore;
    resultScore.style.color = riskColor;

    resultRisk.textContent = (data.riskLevel || "unknown").toUpperCase() + " RISK";
    resultRisk.style.background = riskColor + "20";
    resultRisk.style.color = riskColor;
    resultRisk.style.border = "1px solid " + riskColor + "40";

    resultRec.textContent = data.recommendation || "";

    resultFlags.textContent = "";
    if (data.redFlags && data.redFlags.length > 0) {
      const title = document.createElement("div");
      title.className = "result-flags-title";
      title.textContent = "Detected Issues";
      resultFlags.appendChild(title);

      for (const flag of data.redFlags.slice(0, 8)) {
        const color = getSeverityColor(flag.severity);

        const item = document.createElement("div");
        item.className = "flag-item";

        const badge = document.createElement("span");
        badge.className = "flag-badge";
        badge.style.background = color + "20";
        badge.style.color = color;
        badge.style.border = "1px solid " + color + "40";
        badge.textContent = flag.severity;

        const message = document.createElement("span");
        message.textContent = flag.message;

        item.appendChild(badge);
        item.appendChild(message);
        resultFlags.appendChild(item);
      }
    }

    scanResult.classList.add("visible");
  } catch (err) {
    scanError.textContent = err.message || "Something went wrong.";
    scanError.classList.add("visible");
  } finally {
    scanBtn.disabled = false;
    scanBtn.textContent = "";
    const btnIcon = document.createElement("img");
    btnIcon.src = "icons/icon16.png";
    btnIcon.width = 16;
    btnIcon.height = 16;
    btnIcon.alt = "";
    btnIcon.style.borderRadius = "2px";
    scanBtn.appendChild(btnIcon);
    scanBtn.appendChild(document.createTextNode(" Analyze This Job Posting"));
  }
});
