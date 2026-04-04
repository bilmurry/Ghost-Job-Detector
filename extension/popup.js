
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
const repostSection = document.getElementById("repost-section");
const repostContent = document.getElementById("repost-content");
const autoScanNotice = document.getElementById("auto-scan-notice");
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

function renderRepostSection(repostData) {
  if (!repostData) return;

  repostContent.innerHTML = "";

  if (repostData.isRepost) {
    const alert = document.createElement("div");
    alert.className = "repost-alert";
    alert.setAttribute("data-testid", "repost-alert");
    alert.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
    const repostCount = Number(repostData.repostCount) || 0;
    alert.appendChild(document.createTextNode(` Repost detected (seen ${repostCount} time${repostCount !== 1 ? "s" : ""})`));
    repostContent.appendChild(alert);
  }

  const meta = document.createElement("div");
  meta.className = "repost-meta";
  meta.setAttribute("data-testid", "repost-meta");

  if (repostData.firstSeen) {
    const date = new Date(repostData.firstSeen);
    meta.appendChild(document.createTextNode("First seen: "));
    const firstSeenValue = document.createElement("span");
    firstSeenValue.textContent = date.toLocaleDateString();
    meta.appendChild(firstSeenValue);
    meta.appendChild(document.createElement("br"));
  }
  meta.appendChild(document.createTextNode("Times listed: "));
  const timesListedValue = document.createElement("span");
  timesListedValue.textContent = String(Number(repostData.repostCount) || 0);
  meta.appendChild(timesListedValue);
  repostContent.appendChild(meta);

  if (repostData.sites && repostData.sites.length > 0) {
    const sitesContainer = document.createElement("div");
    sitesContainer.className = "repost-sites";
    sitesContainer.setAttribute("data-testid", "repost-sites");
    for (const site of repostData.sites) {
      const tag = document.createElement("span");
      tag.className = "site-tag";
      tag.textContent = site;
      sitesContainer.appendChild(tag);
    }
    repostContent.appendChild(sitesContainer);
  }

  repostSection.classList.add("visible");
}

async function runScan(isAutoScan) {
  scanBtn.disabled = true;
  scanError.classList.remove("visible");
  scanResult.classList.remove("visible");
  repostSection.classList.remove("visible");

  if (isAutoScan) {
    autoScanNotice.classList.add("visible");
    scanBtn.style.display = "none";
  } else {
    scanBtn.textContent = "Analyzing...";
  }

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

    if (data.repostDetection) {
      renderRepostSection(data.repostDetection);
    }


    scanResult.classList.add("visible");
  } catch (err) {
    scanError.textContent = err.message || "Something went wrong.";
    scanError.classList.add("visible");
  } finally {
    autoScanNotice.classList.remove("visible");
    scanBtn.style.display = "";
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
}

scanBtn.addEventListener("click", () => runScan(false));

(async function autoScanOnOpen() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) return;

    const response = await chrome.runtime.sendMessage({
      type: "CHECK_JOB_PAGE",
      tabId: tab.id,
    });

    if (response && response.isJobPage) {
      runScan(true);
    }
  } catch {}
})();
