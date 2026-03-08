function decodeHtmlEntities(str = "") {
  const doc = new DOMParser().parseFromString(str, "text/html");
  return doc.body?.textContent || str;
}

function cleanText(str = "") {
  return decodeHtmlEntities(str)
    .replace(/\s+/g, " ")
    .replace(/\u00a0/g, " ")
    .trim();
}

function pickFirst(...vals) {
  for (const v of vals) {
    if (typeof v === "string" && cleanText(v)) return cleanText(v);
  }
  return "";
}

function getMeta(name) {
  const el =
    document.querySelector(`meta[name="${name}"]`) ||
    document.querySelector(`meta[property="${name}"]`);
  return el ? cleanText(el.getAttribute("content") || "") : "";
}

function safeJsonParse(text) {
  try { return JSON.parse(text); } catch { return null; }
}

function queryText(selectors) {
  if (typeof selectors === "string") selectors = [selectors];
  for (const sel of selectors) {
    try {
      const el = document.querySelector(sel);
      if (el) {
        const text = cleanText(el.innerText || el.textContent || "");
        if (text) return text;
      }
    } catch {}
  }
  return "";
}

function getJsonLdJobPosting() {
  const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
  for (const s of scripts) {
    const data = safeJsonParse(s.textContent || "");
    if (!data) continue;

    const nodes = Array.isArray(data) ? data : [data];

    for (const node of nodes) {
      const graph = node && node["@graph"] ? node["@graph"] : [node];
      for (const g of graph) {
        if (!g) continue;
        const type = g["@type"];
        if (type === "JobPosting" || (Array.isArray(type) && type.includes("JobPosting"))) {
          return g;
        }
      }
    }
  }
  return null;
}

function extractFromJsonLd() {
  const jp = getJsonLdJobPosting();
  if (!jp) return null;

  const title = cleanText(jp.title || "");
  const desc = cleanText(jp.description || "");
  const org = jp.hiringOrganization || jp.organization || {};
  const company = cleanText(typeof org === "string" ? org : (org.name || ""));

  let salary = "";
  const baseSalary = jp.baseSalary;
  if (baseSalary && typeof baseSalary === "object") {
    const val = baseSalary.value;
    if (val && typeof val === "object") {
      const parts = [];
      if (baseSalary.currency) parts.push(baseSalary.currency);
      if (val.minValue && val.maxValue) {
        parts.push(`${val.minValue}-${val.maxValue}`);
      } else if (val.value) {
        parts.push(val.value);
      }
      if (baseSalary.unitText) parts.push(`per ${baseSalary.unitText}`);
      salary = parts.join(" ");
    }
    if (typeof val === "string") salary = cleanText(val);
    if (typeof val === "number") salary = String(val);
  }
  if (!salary && jp.estimatedSalary) {
    const est = Array.isArray(jp.estimatedSalary) ? jp.estimatedSalary[0] : jp.estimatedSalary;
    if (est && typeof est === "object") {
      const parts = [];
      if (est.currency) parts.push(est.currency);
      if (est.value && typeof est.value === "object") {
        if (est.value.minValue) parts.push(est.value.minValue);
        if (est.value.maxValue) parts.push("-", est.value.maxValue);
      }
      if (parts.length) salary = parts.join(" ");
    }
  }

  let loc = "";
  if (jp.jobLocation) {
    const jl = Array.isArray(jp.jobLocation) ? jp.jobLocation[0] : jp.jobLocation;
    if (jl && jl.address) {
      const addr = jl.address;
      const locParts = [addr.addressLocality, addr.addressRegion, addr.addressCountry].filter(Boolean);
      loc = locParts.join(", ");
    }
  }

  return { title, company, description: desc, salary, location: loc };
}

function extractSiteSpecific() {
  const host = window.location.hostname;

  if (host.includes("linkedin.com")) {
    return {
      title: pickFirst(
        queryText([
          'h1.t-24',
          'h1.topcard__title',
          'h1.job-details-jobs-unified-top-card__job-title',
          'h1[class*="job-title"]',
          '.jobs-unified-top-card__job-title',
          'h3.base-search-card__title',
          '.job-details-jobs-unified-top-card__job-title a',
          '.top-card-layout__title',
          'h2.top-card-layout__title',
          'h1',
        ]),
        getMeta("og:title"),
        document.title
      ),
      company: pickFirst(
        queryText([
          '.jobs-unified-top-card__company-name a',
          '.jobs-unified-top-card__company-name',
          '.job-details-jobs-unified-top-card__company-name a',
          '.job-details-jobs-unified-top-card__company-name',
          'a[data-tracking-control-name="public_jobs_topcard-org-name"]',
          '.topcard__org-name-link',
          'a.topcard__org-name-link',
          '.top-card-layout__card .topcard__org-name-link',
          'a[data-tracking-control-name="public_jobs_topcard_org_name"]',
          'span.topcard__flavor a',
          '.topcard__flavor--black-link',
        ])
      ),
      description: pickFirst(
        queryText([
          '.jobs-description__content',
          '.jobs-description-content__text',
          '.jobs-box__html-content',
          '.description__text',
          '.show-more-less-html__markup',
          '#job-details',
          '.jobs-description',
          '[data-automation-id="jobPostingDescription"]',
          'section.description',
        ])
      ),
      salary: pickFirst(
        queryText([
          '.salary.compensation__salary',
          '.compensation__salary',
          '.jobs-unified-top-card__job-insight--highlight span',
          '.job-details-jobs-unified-top-card__job-insight span',
        ])
      ),
      location: pickFirst(
        queryText([
          '.jobs-unified-top-card__bullet',
          '.topcard__flavor--bullet',
          '.job-details-jobs-unified-top-card__bullet',
          '.top-card-layout__card .topcard__flavor:not(.topcard__flavor--bullet)',
        ])
      )
    };
  }

  if (host.includes("indeed.com")) {
    return {
      title: pickFirst(
        queryText([
          'h1[data-testid="jobsearch-JobInfoHeader-title"]',
          '.jobsearch-JobInfoHeader-title',
          'h2.jobTitle span',
          'h2.jobTitle',
          'h1.icl-u-xs-mb--xs',
          'h1',
        ]),
        getMeta("og:title")
      ),
      company: pickFirst(
        queryText([
          '[data-testid="inlineHeader-companyName"] a',
          '[data-testid="inlineHeader-companyName"]',
          '[data-testid="company-name"]',
          '[data-company-name="true"]',
          '.jobsearch-CompanyInfoWithoutHeaderImage a',
          '.icl-u-lg-mr--sm a',
          'div[data-company-name] a',
          '.companyName',
        ])
      ),
      description: pickFirst(
        queryText([
          '#jobDescriptionText',
          '.jobsearch-JobComponent-description',
          '#jobDescriptionSection',
          '#jobsearch-ViewjobPaneWrapper .jobsearch-jobDescriptionText',
          'div.jobsearch-jobDescriptionText',
        ])
      ),
      salary: pickFirst(
        queryText([
          '#salaryInfoAndJobType span',
          '[data-testid="attribute_snippet_testid"]',
          '.jobsearch-JobMetadataHeader-item',
          '.salary-snippet-container',
          '.attribute_snippet',
        ])
      ),
      location: pickFirst(
        queryText([
          '[data-testid="inlineHeader-companyLocation"]',
          '[data-testid="job-location"]',
          '.jobsearch-JobInfoHeader-subtitle div:last-child',
          '.companyLocation',
        ])
      )
    };
  }

  if (host.includes("glassdoor.com")) {
    return {
      title: pickFirst(
        queryText([
          '[data-test="job-title"]',
          '.JobDetails_jobTitle__Rbnx1',
          '.jobLink',
          '.e1tk4kwz5',
          'h1',
        ]),
        getMeta("og:title")
      ),
      company: pickFirst(
        queryText([
          '[data-test="employer-name"]',
          '[data-test="employerName"]',
          '.EmployerProfile_compactEmployerName__9MGoc',
          '.e1tk4kwz4',
          '.css-87ung5',
          '.JobDetails_companyName__24Yrq a',
        ])
      ),
      description: pickFirst(
        queryText([
          '[data-test="jobDescriptionContent"]',
          '.jobDescriptionContent',
          '#JobDescriptionContainer',
          '.JobDetails_jobDescription__uW_fK',
          '.desc',
          '.JobDesc_jobDescription__SWgLR',
        ])
      ),
      salary: pickFirst(
        queryText([
          '[data-test="detailSalary"]',
          '.SalaryEstimate_salaryRange__brHFy',
          '.css-1bluz6i',
        ])
      ),
      location: pickFirst(
        queryText([
          '[data-test="location"]',
          '[data-test="emp-location"]',
          '.JobDetails_location__MbnkR',
          '.e1tk4kwz1',
        ])
      )
    };
  }

  if (host.includes("ziprecruiter.com")) {
    return {
      title: pickFirst(
        queryText([
          'h1.job_title',
          'h1',
          '.job_title',
          '[data-testid="job-title"]',
        ]),
        getMeta("og:title"),
        document.title
      ),
      company: pickFirst(
        queryText([
          '[data-testid="company_name"]',
          'a[data-testid="job-detail-company-name"]',
          '.hiring_company_text',
          '.jobList-introMeta',
          '.hiring_company a',
          '.t-company_name',
          'a.company_name',
        ])
      ),
      description: pickFirst(
        queryText([
          '[data-testid="job_description"]',
          '.jobDescriptionSection',
          '#job_description',
          '.job_description',
          '.job_description_text',
          '.responsibilities_section',
        ])
      ),
      salary: pickFirst(
        queryText([
          '.job_salary',
          '[data-testid="salary"]',
          '.salary_estimate',
        ])
      ),
      location: pickFirst(
        queryText([
          '.job_location',
          '[data-testid="location"]',
          '.location_text',
        ])
      )
    };
  }

  return null;
}

function extractGenericFallback() {
  const title = pickFirst(getMeta("og:title"), document.title);
  const company = pickFirst(getMeta("og:site_name"), getMeta("author"));

  const descEl = document.querySelector('[class*="description"]') ||
    document.querySelector('[id*="description"]') ||
    document.querySelector('[class*="job-detail"]') ||
    document.querySelector('[id*="job-detail"]') ||
    document.querySelector("article") ||
    document.querySelector("main") ||
    document.body;

  const text = cleanText(descEl?.innerText || "");
  const description = text.slice(0, 4000);

  return { title, company, description };
}

function extractJobData() {
  const fromLd = extractFromJsonLd();
  if (fromLd && (fromLd.title || fromLd.company || fromLd.description)) {
    const fromSite = extractSiteSpecific();
    if (fromSite) {
      return {
        title: fromLd.title || cleanText(fromSite.title || ""),
        company: fromLd.company || cleanText(fromSite.company || ""),
        description: fromLd.description || cleanText(fromSite.description || ""),
        salary: fromLd.salary || cleanText(fromSite.salary || ""),
        location: fromLd.location || cleanText(fromSite.location || ""),
      };
    }
    return fromLd;
  }

  const fromSite = extractSiteSpecific();
  if (fromSite && (fromSite.title || fromSite.company || fromSite.description)) {
    return {
      title: cleanText(fromSite.title || ""),
      company: cleanText(fromSite.company || ""),
      description: cleanText(fromSite.description || ""),
      salary: cleanText(fromSite.salary || ""),
      location: cleanText(fromSite.location || ""),
    };
  }

  const fromGeneric = extractGenericFallback();
  return {
    title: cleanText(fromGeneric.title || ""),
    company: cleanText(fromGeneric.company || ""),
    description: cleanText(fromGeneric.description || ""),
    salary: "",
    location: "",
  };
}

function isJobPostingPage() {
  const host = window.location.hostname;
  const path = window.location.pathname;
  const href = window.location.href;

  if (host.includes("linkedin.com") && (path.includes("/jobs/") || path.includes("/jobs?") || href.includes("currentJobId="))) return true;
  if (host.includes("indeed.com") && (path.includes("/viewjob") || path.includes("/rc/clk") || path.includes("/jobs") || href.includes("vjk="))) return true;
  if (host.includes("glassdoor.com")) {
    if (path.includes("/job-listing") || path.includes("/Job") || path.includes("/Jobs") || path.includes("/partner/jobListing") || path.includes("/job/") || path.includes("/job-")) return true;
    if (document.querySelector('[data-test="jobListing"]') || document.querySelector('[data-test="job-title"]') || document.querySelector('[class*="JobDetails"]') || document.querySelector('.jobHeader') || document.querySelector('[data-test="jobDescriptionContent"]') || document.querySelector('#JobDescriptionContainer') || document.querySelector('[class*="jobDescription"]')) return true;
  }
  if (host.includes("ziprecruiter.com")) {
    if (path.includes("/jobs/") || path.includes("/c/") || path.includes("/job/") || path.includes("/k/") || path.includes("/ojob/")) return true;
    if (document.querySelector('[class*="job_content"]') || document.querySelector('[data-testid="job-detail"]') || document.querySelector('.jobDescriptionSection') || document.querySelector('#job_description') || document.querySelector('.job_description') || document.querySelector('[class*="job_title"]') || document.querySelector('h1.job_title')) return true;
  }

  if (getJsonLdJobPosting()) return true;

  return false;
}

let ghostButtonState = "idle";

function getScoreColor(score) {
  if (score >= 70) return { bg: "#EF4444", text: "#FFFFFF", label: "High Risk" };
  if (score >= 50) return { bg: "#F59E0B", text: "#FFFFFF", label: "Medium Risk" };
  if (score >= 30) return { bg: "#F97316", text: "#FFFFFF", label: "Some Risk" };
  return { bg: "#10B981", text: "#FFFFFF", label: "Low Risk" };
}

function createFloatingGhostButton() {
  if (document.getElementById("ghost-hunter-fab")) return;

  const container = document.createElement("div");
  container.id = "ghost-hunter-fab";
  container.setAttribute("data-testid", "ghost-hunter-fab");

  const existingStyle = document.getElementById("ghost-fab-styles");
  if (existingStyle) existingStyle.remove();

  const style = document.createElement("style");
  style.id = "ghost-fab-styles";
  style.textContent = `
    @keyframes ghost-fab-pulse {
      0%, 100% { box-shadow: 0 4px 14px rgba(0,0,0,0.25); }
      50% { box-shadow: 0 4px 20px rgba(13,148,136,0.4); }
    }
    @keyframes ghost-fab-spin {
      to { transform: rotate(360deg); }
    }
    @keyframes ghost-fab-enter {
      from { opacity: 0; transform: scale(0.5) translateY(10px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }
    @keyframes ghost-fab-score-enter {
      from { opacity: 0; transform: scale(0.7); }
      to { opacity: 1; transform: scale(1); }
    }
    #ghost-hunter-fab {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      animation: ghost-fab-enter 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }
    #ghost-fab-btn {
      width: 52px;
      height: 52px;
      border-radius: 50%;
      border: none;
      background: #111418;
      color: #0D9488;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 14px rgba(0,0,0,0.25);
      transition: transform 0.2s, background 0.3s, box-shadow 0.3s;
      position: relative;
      animation: ghost-fab-pulse 3s ease-in-out infinite;
    }
    #ghost-fab-btn:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 20px rgba(0,0,0,0.35);
    }
    #ghost-fab-btn:active {
      transform: scale(0.95);
    }
    #ghost-fab-btn.scanning {
      animation: none;
      cursor: wait;
    }
    #ghost-fab-btn.scored {
      animation: none;
    }
    #ghost-fab-spinner {
      width: 22px;
      height: 22px;
      border: 2.5px solid rgba(13,148,136,0.2);
      border-top-color: #0D9488;
      border-radius: 50%;
      animation: ghost-fab-spin 0.7s linear infinite;
    }
    #ghost-fab-tooltip {
      position: absolute;
      right: 60px;
      top: 50%;
      transform: translateY(-50%);
      background: #111418;
      color: #E6E8EB;
      border: 1px solid #2A2D35;
      border-radius: 8px;
      padding: 8px 12px;
      font-size: 12px;
      font-weight: 500;
      white-space: nowrap;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.2s;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }
    #ghost-fab-btn:hover + #ghost-fab-tooltip,
    #ghost-fab-tooltip.visible {
      opacity: 1;
    }
    #ghost-fab-result {
      position: absolute;
      right: 60px;
      bottom: 0;
      background: #111418;
      border: 1px solid #2A2D35;
      border-radius: 12px;
      padding: 16px 18px;
      font-size: 13px;
      color: #E6E8EB;
      width: 240px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.35);
      animation: ghost-fab-score-enter 0.3s ease-out forwards;
    }
    #ghost-fab-result-close {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      border: none;
      background: #2A2D35;
      color: #9CA3AF;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      line-height: 1;
      transition: background 0.15s;
    }
    #ghost-fab-result-close:hover {
      background: #3A3D45;
      color: #E6E8EB;
    }
    .ghost-fab-score-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .ghost-fab-score-num {
      font-size: 28px;
      font-weight: 700;
      line-height: 1;
    }
    .ghost-fab-score-label {
      font-size: 12px;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .ghost-fab-bar {
      height: 4px;
      border-radius: 2px;
      background: #2A2D35;
      overflow: hidden;
      margin-bottom: 10px;
    }
    .ghost-fab-bar-fill {
      height: 100%;
      border-radius: 2px;
      transition: width 0.8s ease-out;
    }
    .ghost-fab-meta {
      font-size: 12px;
      color: #9CA3AF;
      line-height: 1.6;
    }
    .ghost-fab-flags {
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid #2A2D35;
    }
    .ghost-fab-flag-item {
      font-size: 12px;
      color: #F59E0B;
      display: flex;
      align-items: flex-start;
      gap: 5px;
      margin-bottom: 4px;
      line-height: 1.4;
    }
    .ghost-fab-flag-dot {
      width: 4px;
      height: 4px;
      border-radius: 50%;
      flex-shrink: 0;
      margin-top: 5px;
    }
    .ghost-fab-actions {
      margin-top: 10px;
      display: flex;
      gap: 6px;
    }
    .ghost-fab-action-btn {
      flex: 1;
      padding: 7px;
      border-radius: 6px;
      border: 1px solid #2A2D35;
      background: transparent;
      color: #E6E8EB;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      text-align: center;
      transition: background 0.15s, border-color 0.15s;
    }
    .ghost-fab-action-btn:hover {
      background: #1A1D25;
      border-color: #3A3D45;
    }
    .ghost-fab-action-btn.primary {
      background: #0D9488;
      color: #FFFFFF;
      border-color: #0D9488;
    }
    .ghost-fab-action-btn.primary:hover {
      background: #0F766E;
      border-color: #0F766E;
    }
  `;
  document.head.appendChild(style);

  const fabIconUrl = chrome.runtime.getURL("icons/fab-icon.png");
  const ghostImg = `<img src="${fabIconUrl}" width="34" height="34" alt="Ghost" style="border-radius:50%;object-fit:contain;image-rendering:-webkit-optimize-contrast;" />`;

  const btn = document.createElement("button");
  btn.id = "ghost-fab-btn";
  btn.setAttribute("data-testid", "ghost-fab-btn");
  btn.innerHTML = ghostImg;

  const tooltip = document.createElement("div");
  tooltip.id = "ghost-fab-tooltip";
  tooltip.textContent = "Scan for ghost job";

  container.appendChild(btn);
  container.appendChild(tooltip);
  document.body.appendChild(container);

  btn.addEventListener("click", () => {
    if (ghostButtonState === "scanning") return;

    const existingResult = document.getElementById("ghost-fab-result");
    if (existingResult) existingResult.remove();

    ghostButtonState = "scanning";
    btn.classList.add("scanning");
    btn.classList.remove("scored");
    btn.innerHTML = `<div id="ghost-fab-spinner"></div>`;
    tooltip.textContent = "Analyzing...";
    tooltip.classList.add("visible");

    const jobData = extractJobData();

    if (!jobData.title && !jobData.company && !jobData.description) {
      ghostButtonState = "idle";
      btn.classList.remove("scanning");
      btn.innerHTML = ghostImg;
      tooltip.textContent = "No job data found on this page";
      tooltip.classList.add("visible");
      setTimeout(() => tooltip.classList.remove("visible"), 3000);
      return;
    }

    if (jobData.description && jobData.description.length > 5000) {
      jobData.description = jobData.description.substring(0, 5000);
    }

    chrome.runtime.sendMessage(
      { type: "SCAN_FROM_FAB", jobData },
      (response) => {
        tooltip.classList.remove("visible");

        if (!response || response.error) {
          ghostButtonState = "idle";
          btn.classList.remove("scanning");
          btn.innerHTML = ghostImg;
          tooltip.textContent = response?.error || "Analysis failed";
          tooltip.classList.add("visible");
          setTimeout(() => tooltip.classList.remove("visible"), 4000);
          return;
        }

        const result = response.data;
        const score = typeof result.ghostScore === "number" ? Math.max(0, Math.min(100, result.ghostScore)) : 0;
        result.ghostScore = score;
        const scoreInfo = getScoreColor(score);

        ghostButtonState = "scored";
        btn.classList.remove("scanning");
        btn.classList.add("scored");
        btn.style.background = scoreInfo.bg;
        btn.style.color = scoreInfo.text;
        btn.innerHTML = `<span style="font-size:16px;font-weight:700;line-height:1;">${result.ghostScore}</span>`;

        showFabResult(result, container, btn, ghostImg);
      }
    );
  });
}

function showFabResult(result, container, btn, ghostImg) {
  const existing = document.getElementById("ghost-fab-result");
  if (existing) existing.remove();

  const scoreInfo = getScoreColor(result.ghostScore);
  const panel = document.createElement("div");
  panel.id = "ghost-fab-result";
  panel.setAttribute("data-testid", "ghost-fab-result");

  const closeBtn = document.createElement("button");
  closeBtn.id = "ghost-fab-result-close";
  closeBtn.setAttribute("data-testid", "ghost-fab-result-close");
  closeBtn.textContent = "\u2715";
  closeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    panel.remove();
    ghostButtonState = "idle";
    btn.style.background = "#111418";
    btn.style.color = "#0D9488";
    btn.classList.remove("scored");
    btn.innerHTML = ghostImg;
  });
  panel.appendChild(closeBtn);

  const scoreRow = document.createElement("div");
  scoreRow.className = "ghost-fab-score-row";

  const scoreNum = document.createElement("span");
  scoreNum.className = "ghost-fab-score-num";
  scoreNum.style.color = scoreInfo.bg;
  scoreNum.setAttribute("data-testid", "ghost-fab-score");
  scoreNum.textContent = result.ghostScore;

  const scoreLabel = document.createElement("span");
  scoreLabel.className = "ghost-fab-score-label";
  scoreLabel.style.background = scoreInfo.bg + "22";
  scoreLabel.style.color = scoreInfo.bg;
  scoreLabel.setAttribute("data-testid", "ghost-fab-risk-label");
  scoreLabel.textContent = scoreInfo.label;

  scoreRow.appendChild(scoreNum);
  scoreRow.appendChild(scoreLabel);
  panel.appendChild(scoreRow);

  const bar = document.createElement("div");
  bar.className = "ghost-fab-bar";
  const barFill = document.createElement("div");
  barFill.className = "ghost-fab-bar-fill";
  barFill.style.background = scoreInfo.bg;
  barFill.style.width = "0%";
  bar.appendChild(barFill);
  panel.appendChild(bar);
  const boundedScore = Math.max(0, Math.min(100, result.ghostScore || 0));
  setTimeout(() => { barFill.style.width = boundedScore + "%"; }, 50);

  const meta = document.createElement("div");
  meta.className = "ghost-fab-meta";
  meta.setAttribute("data-testid", "ghost-fab-meta");

  const parts = [];
  parts.push("Confidence: " + (result.confidence || 0) + "%");
  if (result.redFlags && result.redFlags.length > 0) {
    parts.push(result.redFlags.length + " red flag" + (result.redFlags.length > 1 ? "s" : ""));
  }
  if (result.repostDetection && result.repostDetection.isRepost) {
    parts.push("Repost detected (" + result.repostDetection.repostCount + "x)");
  }
  if (result.employerReputation) {
    parts.push("Employer score: " + result.employerReputation.reputationScore + "/100");
  }
  meta.textContent = parts.join(" \u00B7 ");
  panel.appendChild(meta);

  if (result.redFlags && result.redFlags.length > 0) {
    const flagsDiv = document.createElement("div");
    flagsDiv.className = "ghost-fab-flags";
    const topFlags = result.redFlags
      .filter(f => f.severity === "critical" || f.severity === "high")
      .slice(0, 3);
    const showFlags = topFlags.length > 0 ? topFlags : result.redFlags.slice(0, 2);

    for (const flag of showFlags) {
      const item = document.createElement("div");
      item.className = "ghost-fab-flag-item";
      item.setAttribute("data-testid", "ghost-fab-flag");

      const dot = document.createElement("span");
      dot.className = "ghost-fab-flag-dot";
      dot.style.background = flag.severity === "critical" ? "#EF4444" :
                              flag.severity === "high" ? "#F97316" :
                              flag.severity === "medium" ? "#F59E0B" : "#10B981";
      item.appendChild(dot);

      const text = document.createElement("span");
      const msg = flag.message.length > 80 ? flag.message.substring(0, 77) + "..." : flag.message;
      text.textContent = msg;
      item.appendChild(text);

      flagsDiv.appendChild(item);
    }
    panel.appendChild(flagsDiv);
  }

  const actions = document.createElement("div");
  actions.className = "ghost-fab-actions";

  const dismissBtn = document.createElement("button");
  dismissBtn.className = "ghost-fab-action-btn";
  dismissBtn.setAttribute("data-testid", "ghost-fab-dismiss");
  dismissBtn.textContent = "Dismiss";
  dismissBtn.addEventListener("click", () => {
    panel.remove();
    ghostButtonState = "idle";
    btn.style.background = "#111418";
    btn.style.color = "#0D9488";
    btn.classList.remove("scored");
    btn.innerHTML = ghostImg;
  });

  const rescanBtn = document.createElement("button");
  rescanBtn.className = "ghost-fab-action-btn primary";
  rescanBtn.setAttribute("data-testid", "ghost-fab-rescan");
  rescanBtn.textContent = "Re-scan";
  rescanBtn.addEventListener("click", () => {
    panel.remove();
    ghostButtonState = "idle";
    btn.style.background = "#111418";
    btn.style.color = "#0D9488";
    btn.classList.remove("scored");
    btn.innerHTML = ghostImg;
    btn.click();
  });

  actions.appendChild(dismissBtn);
  actions.appendChild(rescanBtn);
  panel.appendChild(actions);

  container.appendChild(panel);
}

function removeFabIfNotJobPage() {
  if (!isJobPostingPage()) {
    const fab = document.getElementById("ghost-hunter-fab");
    if (fab) {
      fab.remove();
      ghostButtonState = "idle";
    }
  }
}

function autoDetectJobPage() {
  if (isJobPostingPage()) {
    createFloatingGhostButton();
    try {
      chrome.runtime.sendMessage({ type: "JOB_PAGE_DETECTED" });
    } catch {}
  } else {
    removeFabIfNotJobPage();
  }
}

let lastCheckedUrl = "";

function checkForSpaNavigation() {
  const currentUrl = window.location.href;
  if (currentUrl !== lastCheckedUrl) {
    lastCheckedUrl = currentUrl;
    setTimeout(autoDetectJobPage, 300);
  }
}

if (document.readyState === "complete" || document.readyState === "interactive") {
  setTimeout(autoDetectJobPage, 500);
  setTimeout(autoDetectJobPage, 2000);
  setTimeout(autoDetectJobPage, 4000);
} else {
  window.addEventListener("DOMContentLoaded", () => {
    setTimeout(autoDetectJobPage, 500);
    setTimeout(autoDetectJobPage, 2000);
    setTimeout(autoDetectJobPage, 4000);
  });
}

setInterval(checkForSpaNavigation, 1500);

const origPushState = history.pushState;
history.pushState = function () {
  origPushState.apply(this, arguments);
  setTimeout(autoDetectJobPage, 300);
};

const origReplaceState = history.replaceState;
history.replaceState = function () {
  origReplaceState.apply(this, arguments);
  setTimeout(autoDetectJobPage, 300);
};

window.addEventListener("popstate", () => {
  setTimeout(autoDetectJobPage, 300);
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === "PING") {
    sendResponse({ ok: true });
    return;
  }
  if (msg?.type === "CHECK_JOB_PAGE") {
    sendResponse({ isJobPage: isJobPostingPage() });
    return;
  }
  if (msg?.type === "SCAN_PAGE") {
    const data = extractJobData();
    sendResponse({ ok: true, data });
  }
});
