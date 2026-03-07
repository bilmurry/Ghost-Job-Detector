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

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === "PING") {
    sendResponse({ ok: true });
    return;
  }
  if (msg?.type === "SCAN_PAGE") {
    const data = extractJobData();
    sendResponse({ ok: true, data });
  }
});
