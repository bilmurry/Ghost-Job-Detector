function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

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

    let flagsHtml = "";
    if (data.redFlags && data.redFlags.length > 0) {
      flagsHtml += '<div class="result-flags-title">Detected Issues</div>';
      for (const flag of data.redFlags.slice(0, 8)) {
        const color = getSeverityColor(flag.severity);
        flagsHtml += `
          <div class="flag-item">
            <span class="flag-badge" style="background:${color}20; color:${color}; border:1px solid ${color}40;">
              ${escapeHtml(flag.severity)}
            </span>
            <span>${escapeHtml(flag.message)}</span>
          </div>`;
      }
    }
    resultFlags.innerHTML = flagsHtml;

    scanResult.classList.add("visible");
  } catch (err) {
    scanError.textContent = err.message || "Something went wrong.";
    scanError.classList.add("visible");
  } finally {
    scanBtn.disabled = false;
    scanBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      Analyze This Job Posting`;
  }
});
