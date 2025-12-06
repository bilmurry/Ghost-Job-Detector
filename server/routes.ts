import type { Express } from "express";
import { createServer, type Server } from "http";
import {
  jobPostingSchema,
  type JobPosting,
  type AnalysisResult,
  type RedFlag,
  type RedFlagSeverity,
} from "@shared/schema";

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
];

const MARKET_RATES: Record<string, number> = {
  "software engineer": 120000,
  "senior software engineer": 160000,
  "marketing manager": 95000,
  "sales representative": 65000,
  "data analyst": 75000,
  "product manager": 130000,
  "project manager": 100000,
  "customer service": 45000,
  "administrative assistant": 42000,
  "accountant": 65000,
  "hr manager": 85000,
  "graphic designer": 55000,
  "web developer": 85000,
  "nurse": 75000,
  "teacher": 55000,
  default: 70000,
};

function getMarketRate(title: string): number {
  const lowerTitle = title.toLowerCase();
  for (const [key, rate] of Object.entries(MARKET_RATES)) {
    if (lowerTitle.includes(key)) {
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
    if (job.salary > marketRate * 2) {
      score += 25;
      flags.push(
        `Salary ($${job.salary.toLocaleString()}) is 100%+ above market rate ($${marketRate.toLocaleString()})`
      );
    } else if (job.salary > marketRate * 1.5) {
      score += 15;
      flags.push(
        `Salary ($${job.salary.toLocaleString()}) is 50%+ above market rate ($${marketRate.toLocaleString()})`
      );
    } else if (job.salary > marketRate * 1.3) {
      score += 8;
      flags.push(
        `Salary appears above typical market rate`
      );
    }
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

  return { score: Math.min(score, 80), flags };
}

function verifyCompany(job: JobPosting): { score: number; flags: string[] } {
  let score = 0;
  const flags: string[] = [];

  if (job.contactEmail) {
    const emailDomain = job.contactEmail.split("@")[1]?.toLowerCase();
    
    if (emailDomain && PERSONAL_EMAIL_DOMAINS.includes(emailDomain)) {
      score += 20;
      flags.push(`Uses personal email domain (${emailDomain}) instead of company email`);
    }

    const companySlug = job.company
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .replace(/llc|inc|corp|ltd|co/g, "");
    
    if (emailDomain && !emailDomain.includes(companySlug.slice(0, 5)) && !PERSONAL_EMAIL_DOMAINS.includes(emailDomain)) {
      score += 10;
      flags.push("Email domain doesn't appear to match company name");
    }
  }

  if (!job.companyWebsite) {
    score += 10;
    flags.push("No company website provided");
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

  return { score: Math.min(score, 60), flags };
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
      if (
        flag.toLowerCase().includes("payment") ||
        flag.toLowerCase().includes("scam") ||
        flag.toLowerCase().includes("100%+")
      ) {
        severity = "critical";
      } else if (
        flag.toLowerCase().includes("immediate") ||
        flag.toLowerCase().includes("unrealistic") ||
        flag.toLowerCase().includes("personal email")
      ) {
        severity = "high";
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
  app.post("/api/analyze", (req, res) => {
    try {
      const parseResult = jobPostingSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({
          error: "Invalid job posting data",
          details: parseResult.error.issues,
        });
      }

      const result = analyzeJobPosting(parseResult.data);
      return res.json(result);
    } catch (error) {
      console.error("Analysis error:", error);
      return res.status(500).json({
        error: "Failed to analyze job posting",
      });
    }
  });

  return httpServer;
}
