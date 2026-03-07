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
  const company = cleanText(org.name || "");

  let salary = "";
  const baseSalary = jp.baseSalary;
  if (baseSalary && typeof baseSalary === "object") {
    const val = baseSalary.value;
    if (val && typeof val === "object") salary = cleanText(val.value || "");
    if (typeof val === "string") salary = cleanText(val);
  }

  return { title, company, description: desc, salary };
}

function extractSiteSpecific() {
  const host = location.hostname;

  if (host.includes("linkedin.com")) {
    return {
      title: pickFirst(
        document.querySelector("h1")?.innerText,
        getMeta("og:title"),
        document.title
      ),
      company: pickFirst(
        document.querySelector('[data-tracking-control-name="public_jobs_topcard-org-name"]')?.innerText,
        document.querySelector(".topcard__org-name-link")?.innerText,
        document.querySelector(".topcard__org-name-link")?.textContent
      ),
      description: pickFirst(
        document.querySelector(".description__text")?.innerText,
        document.querySelector('[data-automation-id="jobPostingDescription"]')?.innerText
      )
    };
  }

  if (host.includes("indeed.com")) {
    return {
      title: pickFirst(
        document.querySelector('h1[data-testid="jobsearch-JobInfoHeader-title"]')?.innerText,
        document.querySelector("h1")?.innerText,
        getMeta("og:title")
      ),
      company: pickFirst(
        document.querySelector('[data-testid="inlineHeader-companyName"]')?.innerText,
        document.querySelector('[data-testid="company-name"]')?.innerText
      ),
      description: pickFirst(
        document.querySelector("#jobDescriptionText")?.innerText
      )
    };
  }

  if (host.includes("glassdoor.com")) {
    return {
      title: pickFirst(
        document.querySelector('[data-test="job-title"]')?.innerText,
        document.querySelector("h1")?.innerText,
        getMeta("og:title")
      ),
      company: pickFirst(
        document.querySelector('[data-test="employer-name"]')?.innerText,
        document.querySelector('[data-test="employerName"]')?.innerText
      ),
      description: pickFirst(
        document.querySelector('[data-test="jobDescriptionContent"]')?.innerText
      )
    };
  }

  if (host.includes("ziprecruiter.com")) {
    return {
      title: pickFirst(
        document.querySelector("h1")?.innerText,
        getMeta("og:title"),
        document.title
      ),
      company: pickFirst(
        document.querySelector('[data-testid="company_name"]')?.innerText,
        document.querySelector(".jobList-introMeta")?.innerText
      ),
      description: pickFirst(
        document.querySelector('[data-testid="job_description"]')?.innerText,
        document.querySelector(".jobDescriptionSection")?.innerText
      )
    };
  }

  return null;
}

function extractGenericFallback() {
  const title = pickFirst(getMeta("og:title"), document.title);
  const company = pickFirst(getMeta("og:site_name"), getMeta("author"));

  const main = document.querySelector("main") || document.body;
  const text = cleanText(main?.innerText || "");
  const description = text.slice(0, 2500);

  return { title, company, description };
}

function extractJobData() {
  const fromLd = extractFromJsonLd();
  if (fromLd && (fromLd.title || fromLd.company || fromLd.description)) return fromLd;

  const fromSite = extractSiteSpecific();
  if (fromSite && (fromSite.title || fromSite.company || fromSite.description)) {
    return {
      title: cleanText(fromSite.title),
      company: cleanText(fromSite.company),
      description: cleanText(fromSite.description),
      salary: cleanText(fromSite.salary || "")
    };
  }

  const fromGeneric = extractGenericFallback();
  return {
    title: cleanText(fromGeneric.title),
    company: cleanText(fromGeneric.company),
    description: cleanText(fromGeneric.description),
    salary: cleanText(fromGeneric.salary || "")
  };
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === "SCAN_PAGE") {
    const data = extractJobData();
    sendResponse({ ok: true, data });
  }
});
