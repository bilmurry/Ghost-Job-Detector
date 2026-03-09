import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Download,
  Chrome,
  Puzzle,
  Pin,
  MousePointerClick,
  Scan,
  GripVertical,
  ArrowLeft,
  CheckCircle2,
  Shield,
  Zap,
  Eye,
  Globe,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { usePageTracker } from "@/hooks/use-page-tracker";
import { useSEO } from "@/hooks/use-seo";

const steps = [
  {
    number: 1,
    title: "Download the Extension",
    description: "Download the Ghost Hunter Mode extension files. Click the button below to get the latest version.",
    icon: Download,
    color: "text-teal-500",
    bgColor: "bg-teal-500/10 dark:bg-teal-500/15",
    borderColor: "border-teal-500/20",
  },
  {
    number: 2,
    title: "Open Chrome Extensions",
    description: "In Chrome, go to chrome://extensions or click the puzzle icon in your toolbar and select \"Manage Extensions\" at the bottom.",
    icon: Puzzle,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10 dark:bg-blue-500/15",
    borderColor: "border-blue-500/20",
  },
  {
    number: 3,
    title: "Enable Developer Mode",
    description: "Toggle on \"Developer mode\" in the top-right corner of the Extensions page. This allows you to load unpacked extensions.",
    icon: Chrome,
    color: "text-violet-500",
    bgColor: "bg-violet-500/10 dark:bg-violet-500/15",
    borderColor: "border-violet-500/20",
  },
  {
    number: 4,
    title: "Load the Extension",
    description: "Click \"Load unpacked\" in the top-left, then select the unzipped extension folder. Ghost Hunter Mode will appear in your extensions list.",
    icon: MousePointerClick,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10 dark:bg-amber-500/15",
    borderColor: "border-amber-500/20",
  },
  {
    number: 5,
    title: "Pin It to Your Toolbar",
    description: "Click the puzzle icon in Chrome's toolbar, find Ghost Hunter Mode, and click the pin icon so it's always visible.",
    icon: Pin,
    color: "text-rose-500",
    bgColor: "bg-rose-500/10 dark:bg-rose-500/15",
    borderColor: "border-rose-500/20",
  },
  {
    number: 6,
    title: "Start Scanning Jobs",
    description: "Visit any job listing on LinkedIn, Indeed, Glassdoor, or ZipRecruiter. The ghost button appears automatically. Click it to scan, or drag it anywhere on screen.",
    icon: Scan,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10 dark:bg-emerald-500/15",
    borderColor: "border-emerald-500/20",
  },
];

const features = [
  {
    icon: Shield,
    title: "Ghost Job Detection",
    description: "AI-powered analysis identifies fake listings, scams, and red flags in seconds.",
  },
  {
    icon: Eye,
    title: "Repost Fingerprinting",
    description: "Detects recycled and reposted job listings across employers and time periods.",
  },
  {
    icon: Zap,
    title: "Instant Results",
    description: "Get a risk score, red flags, and actionable recommendations without leaving the page.",
  },
  {
    icon: GripVertical,
    title: "Draggable Interface",
    description: "Move the floating ghost button anywhere on screen. It stays where you put it.",
  },
  {
    icon: Globe,
    title: "Multi-Site Support",
    description: "Works on LinkedIn, Indeed, Glassdoor, ZipRecruiter, and any site with job schema data.",
  },
];

const supportedSites = [
  { name: "LinkedIn", domain: "linkedin.com/jobs" },
  { name: "Indeed", domain: "indeed.com" },
  { name: "Glassdoor", domain: "glassdoor.com" },
  { name: "ZipRecruiter", domain: "ziprecruiter.com" },
];

export default function ExtensionPage() {
  usePageTracker("extension");
  useSEO({
    title: "Ghost Hunter Mode Chrome Extension | Ghost Job Detector",
    description: "Download the free Ghost Hunter Mode Chrome extension. Scan job listings for ghost jobs, scams, and red flags directly on LinkedIn, Indeed, Glassdoor, and ZipRecruiter.",
    path: "/extension",
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

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-12"
        >
          <div className="text-center space-y-4 pt-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 dark:bg-teal-500/15 border border-teal-500/20 text-teal-600 dark:text-teal-400 text-xs font-medium"
              data-testid="badge-version"
            >
              <Chrome className="w-3.5 h-3.5" />
              Chrome Extension v1.2.0
            </motion.div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground" data-testid="text-page-title">
              Get Ghost Hunter Mode
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
              Install the Chrome extension to scan job listings for ghost jobs, scams, and red flags directly from LinkedIn, Indeed, Glassdoor, and ZipRecruiter.
            </p>
          </div>

          <div className="flex justify-center">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <a href="/extension/ghost-hunter-mode.zip" download data-testid="link-download-extension">
                <Button
                  size="lg"
                  data-testid="button-download-extension"
                >
                  <Download className="w-5 h-5" />
                  Download Extension
                </Button>
              </a>
            </motion.div>
          </div>

          <section className="space-y-6" data-testid="section-features">
            <h2 className="text-xl font-semibold text-center text-foreground">What You Get</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {features.map((feature, i) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.05 }}
                >
                  <Card className="h-full border bg-card/50 dark:bg-card/30" data-testid={`card-feature-${i}`}>
                    <CardContent className="p-5 space-y-2.5">
                      <feature.icon className="w-5 h-5 text-teal-500 dark:text-teal-400" />
                      <h3 className="font-semibold text-sm text-foreground">{feature.title}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </section>

          <section className="space-y-6" data-testid="section-installation">
            <h2 className="text-xl font-semibold text-center text-foreground">Installation Guide</h2>
            <div className="space-y-4 max-w-3xl mx-auto">
              {steps.map((step, i) => (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.08 }}
                >
                  <Card className={`border ${step.borderColor} bg-card/50 dark:bg-card/30`} data-testid={`card-step-${step.number}`}>
                    <CardContent className="p-5">
                      <div className="flex gap-4 items-start">
                        <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${step.bgColor} flex items-center justify-center`}>
                          <step.icon className={`w-5 h-5 ${step.color}`} />
                        </div>
                        <div className="flex-1 space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold ${step.color} tabular-nums`}>Step {step.number}</span>
                            <h3 className="font-semibold text-sm text-foreground">{step.title}</h3>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                          {step.number === 2 && (
                            <code className="inline-block mt-1.5 px-2.5 py-1 text-xs bg-muted rounded-md font-mono text-foreground" data-testid="text-chrome-url">
                              chrome://extensions
                            </code>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </section>

          <section className="space-y-4 max-w-3xl mx-auto" data-testid="section-supported-sites">
            <h2 className="text-xl font-semibold text-center text-foreground">Supported Job Sites</h2>
            <Card className="border bg-card/50 dark:bg-card/30">
              <CardContent className="p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {supportedSites.map((site) => (
                    <div
                      key={site.name}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 dark:bg-muted/30"
                      data-testid={`site-${site.name.toLowerCase()}`}
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <div>
                        <span className="text-sm font-medium text-foreground">{site.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">{site.domain}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  Also works on many other job boards and career pages.
                </p>
              </CardContent>
            </Card>
          </section>

          <section className="max-w-3xl mx-auto space-y-4" data-testid="section-faq">
            <h2 className="text-xl font-semibold text-center text-foreground">FAQ</h2>
            <div className="space-y-3">
              {[
                {
                  q: "Is the extension free?",
                  a: "Yes, Ghost Hunter Mode is completely free to use.",
                },
                {
                  q: "Does it work on other browsers?",
                  a: "Currently it's built for Chrome and Chromium-based browsers (Edge, Brave, Arc, Opera). Firefox support is planned.",
                },
                {
                  q: "What data does the extension collect?",
                  a: "The extension only reads job posting content on the page you're viewing. It sends the job title, company, and description to our API for analysis. No personal data, browsing history, or cookies are collected.",
                },
                {
                  q: "How do I update the extension?",
                  a: "Download the latest version from this page, then go to chrome://extensions and click the refresh icon on Ghost Hunter Mode, or remove and re-load the updated folder.",
                },
                {
                  q: "The ghost button isn't appearing on a job page?",
                  a: "Try refreshing the page. Some sites load content dynamically, so the button checks for job content multiple times after page load. If it still doesn't appear, click the extension popup icon to manually scan.",
                },
              ].map((faq, i) => (
                <Card key={i} className="border bg-card/50 dark:bg-card/30" data-testid={`card-faq-${i}`}>
                  <CardContent className="p-5 space-y-2">
                    <div className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
                      <h3 className="text-sm font-semibold text-foreground">{faq.q}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed pl-6">{faq.a}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <div className="text-center pb-8">
            <Link href="/">
              <Button variant="outline" size="sm" data-testid="button-try-web">
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Try the Web Scanner
              </Button>
            </Link>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
