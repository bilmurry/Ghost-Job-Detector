import type { Express } from "express";
import { createServer, type Server } from "http";
import {
  jobPostingSchema,
  type JobPosting,
  type AnalysisResult,
  type RedFlag,
  type RedFlagSeverity,
} from "@shared/schema";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { analysisStorage } from "./storage";
import { analyzeJobWithAI } from "./ghostAI";

const SUSPICIOUS_PATTERNS = {
  paymentKeywords: [
    "pay for training",
    "buy equipment",
    "send money",
    "deposit check",
    "wire transfer",
    "processing fee",
    "registration fee",
    "upfront cost",
    "investment required",
  ],
  tooGoodKeywords: [
    "get rich quick",
    "unlimited income",
    "work 2 hours",
    "6 figures",
    "no experience needed",
    "anyone can apply",
    "guaranteed income",
    "make money fast",
    "financial freedom",
    "passive income",
    "work from home earn",
    "be your own boss",
    "unlimited earning potential",
  ],
  vagueRequirements: [
    "must be 18",
    "no experience necessary",
    "anyone can apply",
    "no skills required",
    "no resume needed",
    "start immediately",
    "hiring immediately",
  ],
  urgentLanguage: [
    "immediate start",
    "apply now",
    "limited spots",
    "act fast",
    "don't miss out",
    "urgent hiring",
    "apply today",
    "positions filling fast",
    "last chance",
  ],
  scamIndicators: [
    "mlm",
    "multi-level",
    "network marketing",
    "pyramid",
    "cryptocurrency opportunity",
    "forex trading",
    "binary options",
    "work from home opportunity",
    "data entry from home",
  ],
  resumeHarvestingIndicators: [
    "send your resume to",
    "submit your resume",
    "forward your cv",
    "email your resume",
    "send resume and cover letter",
    "attach your resume",
    "reply with your resume",
    "send your cv",
  ],
  resumeHarvestingPatterns: [
    "always hiring",
    "always looking",
    "continuous recruitment",
    "ongoing recruitment",
    "talent pool",
    "talent pipeline",
    "future opportunities",
    "future openings",
    "building our team",
    "general application",
    "open application",
    "evergreen position",
    "evergreen role",
    "rolling basis",
    "no specific deadline",
  ],
  excessiveDataRequests: [
    "social security",
    "ssn",
    "date of birth",
    "bank account",
    "driver's license number",
    "passport number",
    "credit card",
    "mother's maiden name",
    "bank details",
    "routing number",
    "account number",
  ],
};

const PERSONAL_EMAIL_DOMAINS = [
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "aol.com",
  "icloud.com",
  "mail.com",
  "protonmail.com",
  "yandex.com",
  "zoho.com",
  "live.com",
  "msn.com",
  "me.com",
  "inbox.com",
  "fastmail.com",
  "tutanota.com",
  "gmx.com",
  "gmx.net",
  "mail.ru",
  "qq.com",
  "163.com",
  "126.com",
  "sina.com",
  "rediffmail.com",
  "ymail.com",
  "rocketmail.com",
  "att.net",
  "verizon.net",
  "comcast.net",
  "sbcglobal.net",
  "earthlink.net",
  "cox.net",
  "bellsouth.net",
  "optonline.net",
];

const DISPOSABLE_EMAIL_DOMAINS = [
  "tempmail.com",
  "throwaway.email",
  "guerrillamail.com",
  "10minutemail.com",
  "mailinator.com",
  "trashmail.com",
  "fakeinbox.com",
  "temp-mail.org",
  "getnada.com",
  "dispostable.com",
  "maildrop.cc",
  "yopmail.com",
  "sharklasers.com",
  "tmpmail.org",
  "burnermail.io",
  "mytemp.email",
  "temp.email",
  "tempmailo.com",
  "mohmal.com",
  "tempr.email",
];

const MARKET_RATES: Record<string, { median: number; low: number; high: number }> = {
  "software engineer": { median: 120000, low: 70000, high: 200000 },
  "senior software engineer": { median: 160000, low: 120000, high: 250000 },
  "staff engineer": { median: 200000, low: 160000, high: 350000 },
  "principal engineer": { median: 220000, low: 170000, high: 400000 },
  "engineering manager": { median: 180000, low: 130000, high: 300000 },
  "marketing manager": { median: 95000, low: 55000, high: 150000 },
  "marketing coordinator": { median: 50000, low: 35000, high: 70000 },
  "sales representative": { median: 65000, low: 35000, high: 120000 },
  "sales manager": { median: 100000, low: 60000, high: 180000 },
  "data analyst": { median: 75000, low: 50000, high: 120000 },
  "data scientist": { median: 130000, low: 85000, high: 200000 },
  "data engineer": { median: 140000, low: 90000, high: 210000 },
  "product manager": { median: 130000, low: 80000, high: 220000 },
  "project manager": { median: 100000, low: 60000, high: 160000 },
  "customer service": { median: 40000, low: 28000, high: 55000 },
  "administrative assistant": { median: 42000, low: 30000, high: 58000 },
  "executive assistant": { median: 60000, low: 42000, high: 85000 },
  "accountant": { median: 65000, low: 45000, high: 95000 },
  "hr manager": { median: 85000, low: 55000, high: 130000 },
  "recruiter": { median: 65000, low: 40000, high: 100000 },
  "graphic designer": { median: 55000, low: 35000, high: 85000 },
  "ux designer": { median: 95000, low: 60000, high: 150000 },
  "web developer": { median: 85000, low: 50000, high: 140000 },
  "frontend developer": { median: 100000, low: 60000, high: 160000 },
  "backend developer": { median: 110000, low: 65000, high: 175000 },
  "full stack developer": { median: 110000, low: 60000, high: 170000 },
  "devops engineer": { median: 130000, low: 80000, high: 200000 },
  "nurse": { median: 75000, low: 50000, high: 110000 },
  "registered nurse": { median: 80000, low: 55000, high: 115000 },
  "teacher": { median: 55000, low: 35000, high: 80000 },
  "data entry": { median: 35000, low: 25000, high: 48000 },
  "warehouse": { median: 38000, low: 28000, high: 52000 },
  "intern": { median: 40000, low: 0, high: 70000 },
  "entry level": { median: 45000, low: 28000, high: 65000 },
  "cashier": { median: 28000, low: 22000, high: 38000 },
  "retail": { median: 32000, low: 24000, high: 45000 },
  default: { median: 70000, low: 35000, high: 130000 },
};

function getMarketRate(title: string): { median: number; low: number; high: number } {
  const lowerTitle = title.toLowerCase();
  for (const [key, rate] of Object.entries(MARKET_RATES)) {
    if (key !== "default" && lowerTitle.includes(key)) {
      return rate;
    }
  }
  return MARKET_RATES.default;
}

function analyzeContent(job: JobPosting): { score: number; flags: string[] } {
  let score = 0;
  const flags: string[] = [];
  const description = job.description.toLowerCase();
  const requirements = (job.requirements || "").toLowerCase();
  const fullText = `${description} ${requirements}`;

  for (const keyword of SUSPICIOUS_PATTERNS.paymentKeywords) {
    if (fullText.includes(keyword)) {
      score += 25;
      flags.push(`Requests payment or financial information: "${keyword}"`);
      break;
    }
  }

  for (const keyword of SUSPICIOUS_PATTERNS.tooGoodKeywords) {
    if (fullText.includes(keyword)) {
      score += 20;
      flags.push(`Unrealistic promises detected: "${keyword}"`);
      break;
    }
  }

  let vagueCount = 0;
  for (const keyword of SUSPICIOUS_PATTERNS.vagueRequirements) {
    if (fullText.includes(keyword)) {
      vagueCount++;
    }
  }
  if (vagueCount >= 2) {
    score += 15;
    flags.push("Multiple vague or minimal requirements detected");
  } else if (vagueCount === 1) {
    score += 8;
    flags.push("Vague job requirements");
  }

  if (job.requirements && job.requirements.split(/\s+/).length < 30) {
    score += 10;
    flags.push("Requirements section is unusually short");
  }

  for (const keyword of SUSPICIOUS_PATTERNS.urgentLanguage) {
    if (fullText.includes(keyword)) {
      score += 8;
      flags.push(`Uses urgent/pressure language: "${keyword}"`);
      break;
    }
  }

  for (const keyword of SUSPICIOUS_PATTERNS.scamIndicators) {
    if (fullText.includes(keyword)) {
      score += 20;
      flags.push(`Potential scam indicator: "${keyword}"`);
      break;
    }
  }

  if (job.salary) {
    const marketRate = getMarketRate(job.title);
    const salaryFormatted = `$${job.salary.toLocaleString()}`;
    const medianFormatted = `$${marketRate.median.toLocaleString()}`;
    const rangeFormatted = `$${marketRate.low.toLocaleString()}-$${marketRate.high.toLocaleString()}`;

    if (job.salary > marketRate.high * 1.5) {
      score += 25;
      flags.push(
        `Salary (${salaryFormatted}) is far above market range (${rangeFormatted}) - likely bait`
      );
    } else if (job.salary > marketRate.high) {
      score += 12;
      flags.push(
        `Salary (${salaryFormatted}) is above typical market ceiling (${rangeFormatted})`
      );
    } else if (job.salary > 0 && job.salary < marketRate.low * 0.6) {
      score += 18;
      flags.push(
        `Salary (${salaryFormatted}) is well below market floor (${rangeFormatted}) - possible exploitative offer`
      );
    } else if (job.salary > 0 && job.salary < marketRate.low) {
      score += 10;
      flags.push(
        `Salary (${salaryFormatted}) is below typical market range (${rangeFormatted})`
      );
    }
  } else {
    const descLower = job.description.toLowerCase();
    if (descLower.includes("competitive salary") || descLower.includes("competitive compensation") || descLower.includes("competitive pay")) {
      score += 3;
      flags.push("Uses vague 'competitive salary' without specifying compensation");
    }
    if (descLower.includes("doe") || descLower.includes("depends on experience") || descLower.includes("commensurate with experience")) {
      score += 5;
      flags.push("Salary listed as 'depends on experience' without a range - common in ghost listings");
    }
  }

  // Resume harvesting detection
  let harvestIndicatorCount = 0;
  for (const keyword of SUSPICIOUS_PATTERNS.resumeHarvestingIndicators) {
    if (fullText.includes(keyword)) {
      harvestIndicatorCount++;
    }
  }

  let harvestPatternCount = 0;
  for (const keyword of SUSPICIOUS_PATTERNS.resumeHarvestingPatterns) {
    if (fullText.includes(keyword)) {
      harvestPatternCount++;
    }
  }

  if (harvestPatternCount >= 2) {
    score += 20;
    flags.push("Multiple signs this posting may exist to collect resumes rather than fill a real position");
  } else if (harvestPatternCount === 1 && harvestIndicatorCount >= 1) {
    score += 15;
    flags.push("Shows signs of resume harvesting - may not be a real open position");
  } else if (harvestPatternCount === 1) {
    score += 8;
    flags.push("Posting language suggests this may be a pipeline/talent pool listing rather than an active opening");
  } else if (harvestIndicatorCount >= 2) {
    score += 10;
    flags.push("Multiple requests to submit resume directly - may indicate resume harvesting");
  }

  // Excessive personal data requests before hiring
  let dataRequestCount = 0;
  for (const keyword of SUSPICIOUS_PATTERNS.excessiveDataRequests) {
    if (fullText.includes(keyword)) {
      dataRequestCount++;
    }
  }
  if (dataRequestCount >= 2) {
    score += 25;
    flags.push("Requests sensitive personal information (SSN, bank details, etc.) upfront - major red flag");
  } else if (dataRequestCount === 1) {
    score += 15;
    flags.push("Requests sensitive personal information before hiring - unusual for legitimate postings");
  }

  const exclamationCount = (job.description.match(/!/g) || []).length;
  if (exclamationCount > 5) {
    score += 5;
    flags.push("Excessive use of exclamation marks");
  }

  const capsWords = job.description.match(/\b[A-Z]{4,}\b/g) || [];
  if (capsWords.length > 3) {
    score += 5;
    flags.push("Excessive use of ALL CAPS text");
  }

  return { score: Math.min(score, 90), flags };
}

function analyzeEmail(email: string, companyName: string): { score: number; flags: string[] } {
  let score = 0;
  const flags: string[] = [];
  
  const parts = email.split("@");
  if (parts.length !== 2) return { score: 0, flags: [] };
  
  const [localPart, domain] = parts;
  const domainLower = domain.toLowerCase();
  
  // Check for disposable email domains (critical red flag)
  if (DISPOSABLE_EMAIL_DOMAINS.includes(domainLower)) {
    score += 30;
    flags.push(`Uses disposable/temporary email domain (${domainLower}) - critical red flag`);
    return { score, flags };
  }
  
  // Check for personal email domains
  if (PERSONAL_EMAIL_DOMAINS.includes(domainLower)) {
    score += 20;
    flags.push(`Uses personal email domain (${domainLower}) instead of company email`);
    return { score, flags };
  }
  
  // Check for suspicious patterns in email local part
  const numbersInLocal = (localPart.match(/\d/g) || []).length;
  if (numbersInLocal >= 4) {
    score += 8;
    flags.push("Email address contains many numbers (often auto-generated)");
  }
  
  // Check for suspicious local parts
  const suspiciousLocalParts = [
    "jobs", "careers", "hiring", "recruitment", "hr", 
    "apply", "job", "work", "employment", "opportunity"
  ];
  const genericLocalParts = [
    "info", "contact", "admin", "support", "noreply",
    "hello", "team", "office"
  ];
  
  const localLower = localPart.toLowerCase();
  
  // Check if company name appears in email domain
  const companySlug = companyName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .replace(/llc|inc|corp|ltd|co|company|group|holdings/gi, "")
    .trim();
  
  // Extract domain name without TLD
  const domainName = domainLower.split(".")[0];
  
  // Calculate similarity between company name and domain
  const companyChars = companySlug.slice(0, Math.min(5, companySlug.length));
  const domainContainsCompany = companyChars.length >= 3 && domainName.includes(companyChars);
  const companyContainsDomain = companyChars.length >= 3 && companySlug.includes(domainName.slice(0, 3));
  
  if (!domainContainsCompany && !companyContainsDomain && companySlug.length >= 3) {
    // Check if it's not just a generic email
    const isGenericJobEmail = suspiciousLocalParts.some(p => localLower.includes(p));
    const isGenericLocal = genericLocalParts.some(p => localLower === p);
    
    if (!isGenericLocal) {
      score += 12;
      flags.push("Email domain doesn't appear to match company name");
    }
  }
  
  // Check for free subdomain services
  const freeSubdomainServices = [
    "wix.com", "weebly.com", "squarespace.com", "wordpress.com",
    "blogspot.com", "sites.google.com", "github.io", "netlify.app"
  ];
  
  if (freeSubdomainServices.some(s => domainLower.includes(s))) {
    score += 15;
    flags.push("Email uses a free website builder domain - unusual for established companies");
  }
  
  return { score, flags };
}

function verifyCompany(job: JobPosting): { score: number; flags: string[] } {
  let score = 0;
  const flags: string[] = [];

  if (job.contactEmail) {
    const emailAnalysis = analyzeEmail(job.contactEmail, job.company);
    score += emailAnalysis.score;
    flags.push(...emailAnalysis.flags);
  }

  if (!job.companyWebsite) {
    score += 10;
    flags.push("No company website provided");
  } else {
    // Check if website domain matches email domain
    if (job.contactEmail) {
      const emailDomain = job.contactEmail.split("@")[1]?.toLowerCase();
      try {
        const websiteUrl = new URL(job.companyWebsite.startsWith("http") ? job.companyWebsite : `https://${job.companyWebsite}`);
        const websiteDomain = websiteUrl.hostname.replace("www.", "").toLowerCase();
        
        if (emailDomain && emailDomain !== websiteDomain && !PERSONAL_EMAIL_DOMAINS.includes(emailDomain)) {
          // Check if they're related (e.g., company.com vs jobs.company.com)
          const emailRoot = emailDomain.split(".").slice(-2).join(".");
          const websiteRoot = websiteDomain.split(".").slice(-2).join(".");
          
          if (emailRoot !== websiteRoot) {
            score += 8;
            flags.push("Email domain doesn't match company website domain");
          }
        }
      } catch {
        // Invalid URL, already flagged by schema
      }
    }
  }

  const genericCompanyNames = [
    "success",
    "unlimited",
    "solutions",
    "global",
    "enterprise",
    "international",
    "opportunity",
    "elite",
    "premier",
    "prestige",
    "freedom",
    "wealth",
    "dream",
    "destiny",
    "infinity",
  ];
  const lowerCompany = job.company.toLowerCase();
  
  let genericCount = 0;
  for (const term of genericCompanyNames) {
    if (lowerCompany.includes(term)) {
      genericCount++;
    }
  }
  
  if (genericCount >= 2) {
    score += 15;
    flags.push("Company name uses multiple generic/vague terms");
  } else if (genericCount === 1 && job.company.length < 15) {
    score += 8;
    flags.push("Company name appears generic");
  }

  if (job.company.length < 4) {
    score += 10;
    flags.push("Company name is unusually short");
  }

  return { score: Math.min(score, 70), flags };
}

function analyzePostingPatterns(job: JobPosting): { score: number; flags: string[] } {
  let score = 0;
  const flags: string[] = [];

  if (job.postingDate) {
    const postingDate = new Date(job.postingDate);
    const now = new Date();
    const daysDiff = Math.floor(
      (now.getTime() - postingDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff > 120) {
      score += 20;
      flags.push(`Job has been posted for ${daysDiff} days - likely expired or ghost job`);
    } else if (daysDiff > 90) {
      score += 15;
      flags.push(`Job has been posted for ${daysDiff} days - unusually long`);
    } else if (daysDiff > 60) {
      score += 10;
      flags.push(`Job has been posted for ${daysDiff} days`);
    }
  }

  if (job.description.length < 200) {
    score += 12;
    flags.push("Job description is unusually short");
  } else if (job.description.length < 400) {
    score += 6;
    flags.push("Job description could be more detailed");
  }

  if (!job.title.includes(" ") && job.title.length < 10) {
    score += 8;
    flags.push("Job title is vague or incomplete");
  }

  return { score: Math.min(score, 50), flags };
}

function assessCommunication(job: JobPosting): { score: number; flags: string[] } {
  let score = 0;
  const flags: string[] = [];

  if (job.contactMethod === "text_only") {
    score += 20;
    flags.push("Text-only communication is unusual for legitimate job postings");
  }

  if (job.responseTime !== undefined && job.responseTime < 1) {
    score += 25;
    flags.push("Immediate job offer without proper interview process");
  } else if (job.responseTime !== undefined && job.responseTime < 4) {
    score += 10;
    flags.push("Very quick response time may indicate lack of proper vetting");
  }

  if (!job.contactEmail && !job.companyWebsite) {
    score += 15;
    flags.push("No verifiable contact information provided");
  }

  return { score: Math.min(score, 50), flags };
}

function generateRecommendation(score: number): string {
  if (score >= 70) {
    return "This posting shows multiple signs of being a ghost job or scam. We strongly recommend avoiding this opportunity and reporting it if found on a job board.";
  } else if (score >= 50) {
    return "This posting has several concerning elements. Proceed with extreme caution, thoroughly research the company, and never provide personal or financial information upfront.";
  } else if (score >= 30) {
    return "Some concerns were detected. Verify the company's legitimacy through LinkedIn, Glassdoor, and official channels before applying.";
  } else {
    return "This posting appears legitimate based on our analysis. Standard precautions still apply - always research the company before interviews.";
  }
}

function getRiskLevel(score: number): "high" | "medium" | "low-medium" | "low" {
  if (score >= 70) return "high";
  if (score >= 50) return "medium";
  if (score >= 30) return "low-medium";
  return "low";
}

function calculateConfidence(score: number, flagCount: number): number {
  if (score > 60 || flagCount > 5) {
    return Math.min(95, score + flagCount * 3);
  } else if (score > 30 || flagCount > 3) {
    return Math.min(85, 50 + score + flagCount * 4);
  } else {
    return Math.min(75, 40 + score + flagCount * 5);
  }
}

function analyzeJobPosting(job: JobPosting): AnalysisResult {
  const contentAnalysis = analyzeContent(job);
  const companyVerification = verifyCompany(job);
  const postingPatterns = analyzePostingPatterns(job);
  const communication = assessCommunication(job);

  const totalScore = Math.min(
    100,
    contentAnalysis.score +
      companyVerification.score +
      postingPatterns.score +
      communication.score
  );

  const allFlags: RedFlag[] = [];

  const addFlags = (
    flags: string[],
    category: RedFlag["category"],
    baseSeverity: RedFlagSeverity
  ) => {
    for (const flag of flags) {
      let severity = baseSeverity;
      const flagLower = flag.toLowerCase();
      if (
        flagLower.includes("payment") ||
        flagLower.includes("scam") ||
        flagLower.includes("far above market") ||
        (flagLower.includes("sensitive personal information") && flagLower.includes("ssn")) ||
        flagLower.includes("disposable/temporary email")
      ) {
        severity = "critical";
      } else if (
        flagLower.includes("immediate") ||
        flagLower.includes("unrealistic") ||
        flagLower.includes("personal email") ||
        flagLower.includes("resume harvesting") ||
        flagLower.includes("collect resumes") ||
        flagLower.includes("well below market") ||
        flagLower.includes("exploitative") ||
        flagLower.includes("sensitive personal information") ||
        flagLower.includes("likely bait")
      ) {
        severity = "high";
      } else if (
        flagLower.includes("above typical market") ||
        flagLower.includes("below typical market") ||
        flagLower.includes("pipeline") ||
        flagLower.includes("talent pool") ||
        flagLower.includes("depends on experience")
      ) {
        severity = "medium";
      }
      allFlags.push({ severity, message: flag, category });
    }
  };

  addFlags(contentAnalysis.flags, "content", "medium");
  addFlags(companyVerification.flags, "company", "medium");
  addFlags(postingPatterns.flags, "patterns", "low");
  addFlags(communication.flags, "communication", "medium");

  allFlags.sort((a, b) => {
    const severityOrder: RedFlagSeverity[] = ["critical", "high", "medium", "low"];
    return severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity);
  });

  return {
    ghostScore: totalScore,
    confidence: calculateConfidence(totalScore, allFlags.length),
    recommendation: generateRecommendation(totalScore),
    riskLevel: getRiskLevel(totalScore),
    redFlags: allFlags,
    detailedAnalysis: {
      contentAnalysis: {
        score: contentAnalysis.score,
        flags: contentAnalysis.flags,
      },
      companyVerification: {
        score: companyVerification.score,
        flags: companyVerification.flags,
      },
      postingPatterns: {
        score: postingPatterns.score,
        flags: postingPatterns.flags,
      },
      communication: {
        score: communication.score,
        flags: communication.flags,
      },
    },
  };
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup auth before other routes
  await setupAuth(app);
  registerAuthRoutes(app);

  function isAllowedOrigin(origin: string | undefined): boolean {
    if (!origin) return false;
    if (origin.startsWith("chrome-extension://")) return true;
    if (origin.startsWith("moz-extension://")) return true;
    try {
      const host = new URL(origin).hostname;
      return host === "localhost" || host.endsWith(".replit.app") || host.endsWith(".repl.co") || host.endsWith(".replit.dev");
    } catch {
      return false;
    }
  }

  function setCorsHeaders(req: any, res: any) {
    const origin = req.headers.origin;
    if (isAllowedOrigin(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    }
  }

  app.options("/api/analyze", (req, res) => {
    setCorsHeaders(req, res);
    res.setHeader("Access-Control-Max-Age", "86400");
    res.status(204).end();
  });

  app.post("/api/analyze", async (req: any, res) => {
    setCorsHeaders(req, res);

    try {
      const parseResult = jobPostingSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({
          error: "Invalid job posting data",
          details: parseResult.error.issues,
        });
      }

      let result: AnalysisResult;

      try {
        result = await analyzeJobWithAI(parseResult.data);
      } catch (aiError) {
        console.error("AI analysis failed, falling back to rule engine:", aiError);
        result = analyzeJobPosting(parseResult.data);
      }
      
      // Save analysis if user is authenticated
      if (req.isAuthenticated && req.isAuthenticated() && req.user?.claims?.sub) {
        try {
          await analysisStorage.saveAnalysis({
            userId: req.user.claims.sub,
            jobTitle: parseResult.data.title,
            company: parseResult.data.company,
            ghostScore: result.ghostScore,
            riskLevel: result.riskLevel,
            confidence: result.confidence,
            recommendation: result.recommendation,
            redFlagsCount: result.redFlags.length,
            jobPosting: parseResult.data,
            analysisResult: result,
          });
        } catch (saveError) {
          console.error("Failed to save analysis:", saveError);
        }
      }
      
      return res.json(result);
    } catch (error) {
      console.error("Analysis error:", error);
      return res.status(500).json({
        error: "Failed to analyze job posting",
      });
    }
  });

  // Get user's analysis history
  app.get("/api/analyses", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const analyses = await analysisStorage.getUserAnalyses(userId);
      return res.json(analyses);
    } catch (error) {
      console.error("Error fetching analyses:", error);
      return res.status(500).json({ error: "Failed to fetch analyses" });
    }
  });

  // Get single analysis
  app.get("/api/analyses/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const analysis = await analysisStorage.getAnalysis(req.params.id, userId);
      if (!analysis) {
        return res.status(404).json({ error: "Analysis not found" });
      }
      return res.json(analysis);
    } catch (error) {
      console.error("Error fetching analysis:", error);
      return res.status(500).json({ error: "Failed to fetch analysis" });
    }
  });

  // Delete analysis
  app.delete("/api/analyses/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const success = await analysisStorage.deleteAnalysis(req.params.id, userId);
      if (!success) {
        return res.status(404).json({ error: "Analysis not found" });
      }
      return res.json({ success: true });
    } catch (error) {
      console.error("Error deleting analysis:", error);
      return res.status(500).json({ error: "Failed to delete analysis" });
    }
  });

  return httpServer;
}
