(() => {
  if (window.__ghostJobDetectorLoaded) return;
  window.__ghostJobDetectorLoaded = true;

  const SCRAPERS = {
    "linkedin.com": {
      detect: () => window.location.hostname.includes("linkedin.com"),
      scrape: () => {
        const title =
          document.querySelector("h1.t-24")?.textContent?.trim() ||
          document.querySelector(".job-details-jobs-unified-top-card__job-title")?.textContent?.trim() ||
          document.querySelector("h1")?.textContent?.trim() ||
          "";
        const company =
          document.querySelector(".job-details-jobs-unified-top-card__company-name")?.textContent?.trim() ||
          document.querySelector(".jobs-unified-top-card__company-name")?.textContent?.trim() ||
          document.querySelector("a.topcard__org-name-link")?.textContent?.trim() ||
          "";
        const description =
          document.querySelector(".jobs-description__content")?.innerText?.trim() ||
          document.querySelector(".jobs-description-content__text")?.innerText?.trim() ||
          document.querySelector("#job-details")?.innerText?.trim() ||
          "";
        return { title, company, description };
      },
    },

    "indeed.com": {
      detect: () => window.location.hostname.includes("indeed.com"),
      scrape: () => {
        const title =
          document.querySelector(".jobsearch-JobInfoHeader-title")?.textContent?.trim() ||
          document.querySelector("h1[data-testid='jobsearch-JobInfoHeader-title']")?.textContent?.trim() ||
          document.querySelector("h1.icl-u-xs-mb--xs")?.textContent?.trim() ||
          document.querySelector("h1")?.textContent?.trim() ||
          "";
        const company =
          document.querySelector("[data-testid='inlineHeader-companyName']")?.textContent?.trim() ||
          document.querySelector(".jobsearch-CompanyInfoWithoutHeaderImage a")?.textContent?.trim() ||
          document.querySelector(".icl-u-lg-mr--sm")?.textContent?.trim() ||
          "";
        const description =
          document.querySelector("#jobDescriptionText")?.innerText?.trim() ||
          document.querySelector(".jobsearch-jobDescriptionText")?.innerText?.trim() ||
          "";
        return { title, company, description };
      },
    },

    "glassdoor.com": {
      detect: () => window.location.hostname.includes("glassdoor.com"),
      scrape: () => {
        const title =
          document.querySelector("[data-test='job-title']")?.textContent?.trim() ||
          document.querySelector(".job-title")?.textContent?.trim() ||
          document.querySelector("h1")?.textContent?.trim() ||
          "";
        const company =
          document.querySelector("[data-test='employer-name']")?.textContent?.trim() ||
          document.querySelector(".employer-name")?.textContent?.trim() ||
          "";
        const description =
          document.querySelector(".jobDescriptionContent")?.innerText?.trim() ||
          document.querySelector("[data-test='job-description']")?.innerText?.trim() ||
          document.querySelector(".desc")?.innerText?.trim() ||
          "";
        return { title, company, description };
      },
    },

    "ziprecruiter.com": {
      detect: () => window.location.hostname.includes("ziprecruiter.com"),
      scrape: () => {
        const title =
          document.querySelector("h1.job_title")?.textContent?.trim() ||
          document.querySelector("h1")?.textContent?.trim() ||
          "";
        const company =
          document.querySelector(".hiring_company")?.textContent?.trim() ||
          document.querySelector("a.t-header-muted")?.textContent?.trim() ||
          "";
        const description =
          document.querySelector(".jobDescription")?.innerText?.trim() ||
          document.querySelector(".job_description")?.innerText?.trim() ||
          "";
        return { title, company, description };
      },
    },
  };

  function getActiveScraper() {
    for (const [, scraper] of Object.entries(SCRAPERS)) {
      if (scraper.detect()) return scraper;
    }
    return null;
  }

  function fallbackScrape() {
    const title =
      document.querySelector("h1")?.textContent?.trim() ||
      document.title?.split("|")[0]?.split("-")[0]?.trim() ||
      "";
    const company = "";
    const description =
      document.querySelector("main")?.innerText?.trim()?.substring(0, 5000) ||
      document.querySelector("article")?.innerText?.trim()?.substring(0, 5000) ||
      "";
    return { title, company, description };
  }

  function parseSalary(text) {
    const match = text.match(/\$[\d,]+(?:\.\d{2})?(?:\s*[-–]\s*\$[\d,]+)?/);
    if (match) {
      const nums = match[0].match(/[\d,]+/g);
      if (nums && nums.length > 0) {
        const first = parseInt(nums[0].replace(/,/g, ""), 10);
        return isNaN(first) ? undefined : first;
      }
    }
    return undefined;
  }

  function scrapeJobData() {
    const scraper = getActiveScraper();
    const raw = scraper ? scraper.scrape() : fallbackScrape();

    return {
      title: raw.title || "Unknown Position",
      company: raw.company || "Unknown Company",
      description: raw.description?.substring(0, 8000) || "No description available.",
      salary: parseSalary(raw.description || ""),
    };
  }

  function getRiskColor(riskLevel) {
    switch (riskLevel) {
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

  function createButton() {
    const btn = document.createElement("div");
    btn.id = "ghost-detector-btn";
    btn.title = "Analyze this job posting";
    btn.innerHTML = `
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <path d="m9 12 2 2 4-4"/>
      </svg>
    `;
    document.body.appendChild(btn);

    btn.addEventListener("click", () => {
      const panel = document.getElementById("ghost-panel");
      if (panel && panel.classList.contains("ghost-panel-open")) {
        hidePanel();
      } else {
        handleAnalyze();
      }
    });
    return btn;
  }

  function showPanel(content) {
    let panel = document.getElementById("ghost-panel");
    let overlay = document.getElementById("ghost-overlay");

    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "ghost-overlay";
      overlay.addEventListener("click", hidePanel);
      document.body.appendChild(overlay);
    }

    if (!panel) {
      panel = document.createElement("div");
      panel.id = "ghost-panel";
      document.body.appendChild(panel);
    }

    panel.innerHTML = content;
    overlay.style.display = "block";

    requestAnimationFrame(() => {
      overlay.style.opacity = "1";
      panel.classList.add("ghost-panel-open");
    });

    const closeBtn = panel.querySelector("#ghost-panel-close");
    if (closeBtn) closeBtn.addEventListener("click", hidePanel);
  }

  function hidePanel() {
    const panel = document.getElementById("ghost-panel");
    const overlay = document.getElementById("ghost-overlay");
    if (panel) panel.classList.remove("ghost-panel-open");
    if (overlay) {
      overlay.style.opacity = "0";
      setTimeout(() => { overlay.style.display = "none"; }, 300);
    }
  }

  function showLoading(jobData) {
    showPanel(`
      <div class="ghost-panel-header">
        <div class="ghost-panel-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4A8CFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <path d="m9 12 2 2 4-4"/>
          </svg>
          <span>Ghost Job Detector</span>
        </div>
        <button id="ghost-panel-close" class="ghost-close-btn">&times;</button>
      </div>
      <div class="ghost-panel-body">
        <div class="ghost-loading">
          <div class="ghost-spinner"></div>
          <div class="ghost-loading-text">Analyzing posting...</div>
          <div class="ghost-loading-sub">${jobData.title} at ${jobData.company}</div>
        </div>
      </div>
    `);
  }

  function showError(message) {
    showPanel(`
      <div class="ghost-panel-header">
        <div class="ghost-panel-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4A8CFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <path d="m9 12 2 2 4-4"/>
          </svg>
          <span>Ghost Job Detector</span>
        </div>
        <button id="ghost-panel-close" class="ghost-close-btn">&times;</button>
      </div>
      <div class="ghost-panel-body">
        <div class="ghost-error">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          <div class="ghost-error-title">Analysis Failed</div>
          <div class="ghost-error-msg">${message}</div>
        </div>
      </div>
    `);
  }

  function showResults(data) {
    const riskColor = getRiskColor(data.riskLevel);
    const score = data.ghostScore;
    const circumference = 2 * Math.PI * 54;
    const offset = circumference - (score / 100) * circumference;

    const flagsHtml = (data.redFlags || []).slice(0, 8).map((flag) => {
      const color = getSeverityColor(flag.severity);
      return `
        <div class="ghost-flag">
          <span class="ghost-flag-badge" style="background:${color}20; color:${color}; border:1px solid ${color}40;">
            ${flag.severity.toUpperCase()}
          </span>
          <span class="ghost-flag-text">${flag.message}</span>
        </div>
      `;
    }).join("");

    showPanel(`
      <div class="ghost-panel-header">
        <div class="ghost-panel-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4A8CFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <path d="m9 12 2 2 4-4"/>
          </svg>
          <span>Ghost Job Detector</span>
        </div>
        <button id="ghost-panel-close" class="ghost-close-btn">&times;</button>
      </div>

      <div class="ghost-panel-body">
        <div class="ghost-score-section">
          <div class="ghost-score-ring">
            <svg viewBox="0 0 120 120" width="130" height="130">
              <circle cx="60" cy="60" r="54" fill="none" stroke="#2A2D35" stroke-width="8"/>
              <circle cx="60" cy="60" r="54" fill="none" stroke="${riskColor}" stroke-width="8"
                stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"
                stroke-linecap="round" transform="rotate(-90 60 60)"
                style="transition: stroke-dashoffset 0.8s ease;"/>
            </svg>
            <div class="ghost-score-value" style="color:${riskColor};">${score}</div>
          </div>
          <div class="ghost-risk-badge" style="background:${riskColor}20; color:${riskColor}; border:1px solid ${riskColor}40;">
            ${(data.riskLevel || "unknown").toUpperCase()} RISK
          </div>
        </div>

        <div class="ghost-stats-row">
          <div class="ghost-stat">
            <div class="ghost-stat-label">Confidence</div>
            <div class="ghost-stat-value">${data.confidence}%</div>
          </div>
          <div class="ghost-stat">
            <div class="ghost-stat-label">Red Flags</div>
            <div class="ghost-stat-value">${(data.redFlags || []).length}</div>
          </div>
        </div>

        ${data.recommendation ? `
          <div class="ghost-recommendation">
            <div class="ghost-rec-label">Recommendation</div>
            <div class="ghost-rec-text">${data.recommendation}</div>
          </div>
        ` : ""}

        ${flagsHtml ? `
          <div class="ghost-flags-section">
            <div class="ghost-flags-label">Detected Issues</div>
            ${flagsHtml}
          </div>
        ` : ""}

        <div class="ghost-disclaimer">
          AI-assisted analysis tool. Not affiliated with LinkedIn, Indeed, Glassdoor, or ZipRecruiter. Results are advisory only.
        </div>
      </div>
    `);
  }

  async function handleAnalyze() {
    const jobData = scrapeJobData();
    showLoading(jobData);

    chrome.runtime.sendMessage(
      { type: "ANALYZE_JOB", data: jobData },
      (response) => {
        if (chrome.runtime.lastError) {
          showError(chrome.runtime.lastError.message || "Extension communication error.");
          return;
        }
        if (response?.error) {
          showError(response.error);
          return;
        }
        if (response?.data) {
          showResults(response.data);
        } else {
          showError("Unexpected response from server.");
        }
      }
    );
  }

  function init() {
    if (!document.getElementById("ghost-detector-btn")) {
      createButton();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  const observer = new MutationObserver(() => {
    if (!document.getElementById("ghost-detector-btn")) {
      createButton();
    }
  });
  observer.observe(document.body, { childList: true, subtree: false });
})();
