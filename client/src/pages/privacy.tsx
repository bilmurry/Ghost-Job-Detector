import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Shield, Eye, Server, Lock, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { usePageTracker } from "@/hooks/use-page-tracker";
import { useSEO } from "@/hooks/use-seo";

const commitments = [
  {
    icon: Server,
    title: "No Server-Side Scraping",
    description:
      "Our servers never contact job sites on your behalf. We do not fetch, crawl, or scrape any third-party website. All job listing content is provided directly by you.",
  },
  {
    icon: Eye,
    title: "You Control the Data",
    description:
      "Whether you use our Chrome extension or paste job details manually, you decide what information to share. The extension reads only the visible content of the page you are already viewing in your browser.",
  },
  {
    icon: Lock,
    title: "No Credentials or Accounts Accessed",
    description:
      "We never access your job site accounts, login credentials, or private data. The extension operates on publicly visible page content only, the same text you can see and copy yourself.",
  },
  {
    icon: Globe,
    title: "Analysis, Not Collection",
    description:
      "Job listing content you submit is sent to our API solely for analysis. We use AI to evaluate the listing for red flags and ghost job indicators, then return the results to you.",
  },
];

export default function PrivacyPage() {
  usePageTracker("privacy");
  useSEO({
    title: "Privacy & Data Practices | Ghost Job Detector",
    description: "Ghost Job Detector never scrapes job sites. Learn how we handle your data, what the Chrome extension accesses, and our commitment to user privacy.",
    path: "/privacy",
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-14">
            <Link href="/" data-testid="link-home">
              <div className="flex items-center gap-2.5 cursor-pointer">
                <img src="/ghost-logo.png" alt="Ghost Job Detector" className="w-9 h-9 rounded" />
                <span className="text-sm font-semibold tracking-tight text-teal-600 dark:text-teal-400">Ghost Job Detector</span>
              </div>
            </Link>
            <div className="flex items-center gap-1">
              <Link href="/">
                <Button variant="ghost" size="sm" data-testid="button-back-home">
                  <ArrowLeft className="w-4 h-4 mr-1.5" />
                  Back
                </Button>
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-10"
        >
          <div className="text-center space-y-3" data-testid="section-hero">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-teal-500/10 dark:bg-teal-500/15 mb-2">
              <Shield className="w-7 h-7 text-teal-500 dark:text-teal-400" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground" data-testid="text-page-title">
              Privacy & Data Practices
            </h1>
            <p className="text-lg text-teal-600 dark:text-teal-400 font-medium">
              Your data stays yours. Here's how we handle it.
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-5"
            data-testid="section-overview"
          >
            <p className="text-base text-foreground leading-relaxed">
              Ghost Job Detector is designed with a simple principle: <span className="font-semibold">we only analyze content that you voluntarily provide to us.</span> Our servers never reach out to LinkedIn, Indeed, Glassdoor, ZipRecruiter, or any other job site. We do not scrape, crawl, or make automated requests to third-party websites.
            </p>
            <p className="text-base text-muted-foreground leading-relaxed">
              When you use our Chrome extension, it reads the content of the job listing page you are already viewing in your own browser, the same content visible on your screen. That text is then sent to our API for analysis. This is functionally identical to you copying and pasting the text yourself.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
            data-testid="section-commitments"
          >
            <h2 className="text-xl font-semibold text-foreground">Our Commitments</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {commitments.map((item, idx) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 + idx * 0.08 }}
                >
                  <Card className="h-full" data-testid={`card-commitment-${idx}`}>
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-teal-500/10 dark:bg-teal-500/15 flex items-center justify-center">
                          <item.icon className="w-4.5 h-4.5 text-teal-500 dark:text-teal-400" />
                        </div>
                        <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-5"
            data-testid="section-details"
          >
            <h2 className="text-xl font-semibold text-foreground">How Data Flows</h2>
            <div className="rounded-lg border bg-muted/30 dark:bg-muted/20 p-5 space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-500/15 text-teal-600 dark:text-teal-400 text-xs font-bold flex items-center justify-center mt-0.5">1</span>
                  <p className="text-sm text-foreground leading-relaxed">
                    <span className="font-medium">You view a job listing</span> on any supported site (LinkedIn, Indeed, Glassdoor, ZipRecruiter, etc.) in your own browser.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-500/15 text-teal-600 dark:text-teal-400 text-xs font-bold flex items-center justify-center mt-0.5">2</span>
                  <p className="text-sm text-foreground leading-relaxed">
                    <span className="font-medium">The extension reads the visible page content</span> including job title, company name, description, and other details already displayed on your screen.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-500/15 text-teal-600 dark:text-teal-400 text-xs font-bold flex items-center justify-center mt-0.5">3</span>
                  <p className="text-sm text-foreground leading-relaxed">
                    <span className="font-medium">That text is sent to our API</span> for AI-powered analysis. We evaluate it for ghost job indicators, red flags, and scam patterns.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-500/15 text-teal-600 dark:text-teal-400 text-xs font-bold flex items-center justify-center mt-0.5">4</span>
                  <p className="text-sm text-foreground leading-relaxed">
                    <span className="font-medium">Results are returned to you</span> with a risk score, red flags, and recommendations. If you're logged in, results can be saved to your history.
                  </p>
                </div>
              </div>
            </div>

            <h2 className="text-xl font-semibold text-foreground">What We Store</h2>
            <div className="rounded-lg border bg-muted/30 dark:bg-muted/20 p-5 space-y-3">
              <p className="text-sm text-foreground leading-relaxed">
                <span className="font-medium">If you're logged in:</span> Analysis results (job title, company, risk score, and flags) may be saved to your history so you can review past scans. You can view and manage this from your history page.
              </p>
              <p className="text-sm text-foreground leading-relaxed">
                <span className="font-medium">If you're not logged in:</span> Analysis is performed in real-time and results are returned directly to your browser. We do not store the content or results of anonymous scans beyond standard server logs.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We do not sell, share, or monetize any user data. Aggregated, anonymized statistics (such as total scans performed) may be used to improve the service.
              </p>
            </div>

            <h2 className="text-xl font-semibold text-foreground">Chrome Extension Permissions</h2>
            <div className="rounded-lg border bg-muted/30 dark:bg-muted/20 p-5 space-y-3">
              <p className="text-sm text-foreground leading-relaxed">
                The extension requests only the permissions necessary to function:
              </p>
              <ul className="text-sm text-muted-foreground leading-relaxed space-y-2 list-disc list-inside">
                <li><span className="font-medium text-foreground">Active Tab:</span> To read the content of the job listing page you are currently viewing.</li>
                <li><span className="font-medium text-foreground">Host permissions:</span> Limited to supported job sites (LinkedIn, Indeed, Glassdoor, ZipRecruiter) and our API endpoint.</li>
              </ul>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The extension does not track your browsing, access other tabs, or run in the background on unrelated sites.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-center pt-4"
          >
            <p className="text-xs text-muted-foreground">
              Last updated: March 2026
            </p>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}