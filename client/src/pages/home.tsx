import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  Shield,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Info,
  Search,
  FileText,
  Building2,
  Clock,
  MessageSquare,
  Loader2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  LogIn,
  LogOut,
  User,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ThemeToggle } from "@/components/theme-toggle";
import { apiRequest } from "@/lib/queryClient";
import {
  jobPostingSchema,
  type JobPosting,
  type AnalysisResult,
  type RedFlag,
  type RedFlagSeverity,
} from "@shared/schema";

const severityConfig: Record<
  RedFlagSeverity,
  { color: string; bgColor: string; icon: typeof AlertTriangle; label: string }
> = {
  critical: {
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900",
    icon: AlertTriangle,
    label: "Critical",
  },
  high: {
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-900",
    icon: AlertCircle,
    label: "High",
  },
  medium: {
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900",
    icon: Info,
    label: "Medium",
  },
  low: {
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900",
    icon: Info,
    label: "Low",
  },
};

const riskLevelConfig: Record<
  string,
  { color: string; bgColor: string; textColor: string }
> = {
  high: {
    color: "from-red-500 to-red-600",
    bgColor: "bg-red-500",
    textColor: "text-red-600 dark:text-red-400",
  },
  medium: {
    color: "from-amber-500 to-amber-600",
    bgColor: "bg-amber-500",
    textColor: "text-amber-600 dark:text-amber-400",
  },
  "low-medium": {
    color: "from-orange-500 to-orange-600",
    bgColor: "bg-orange-500",
    textColor: "text-orange-600 dark:text-orange-400",
  },
  low: {
    color: "from-green-500 to-green-600",
    bgColor: "bg-green-500",
    textColor: "text-green-600 dark:text-green-400",
  },
};

function RiskScoreCircle({ score, riskLevel }: { score: number; riskLevel: string }) {
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const config = riskLevelConfig[riskLevel] || riskLevelConfig.low;

  return (
    <div className="relative w-40 h-40 mx-auto">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-muted/30"
        />
        <motion.circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          className={config.bgColor}
          style={{
            strokeDasharray: circumference,
          }}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className={`text-4xl font-bold ${config.textColor}`}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          {score}
        </motion.span>
        <span className="text-sm text-muted-foreground">Risk Score</span>
      </div>
    </div>
  );
}

function RecommendationPanel({
  recommendation,
  riskLevel,
}: {
  recommendation: string;
  riskLevel: string;
}) {
  const config = riskLevelConfig[riskLevel] || riskLevelConfig.low;
  const icons: Record<string, typeof AlertTriangle> = {
    high: AlertTriangle,
    medium: AlertCircle,
    "low-medium": Info,
    low: CheckCircle,
  };
  const Icon = icons[riskLevel] || Info;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className={`border-2 ${
        riskLevel === "high"
          ? "border-red-300 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20"
          : riskLevel === "medium"
          ? "border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20"
          : riskLevel === "low-medium"
          ? "border-orange-300 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20"
          : "border-green-300 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20"
      }`}>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-full ${config.bgColor}`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className={`text-lg font-semibold ${config.textColor}`}>
                {riskLevel === "high"
                  ? "High Risk Detected"
                  : riskLevel === "medium"
                  ? "Proceed with Caution"
                  : riskLevel === "low-medium"
                  ? "Some Concerns Noted"
                  : "Appears Legitimate"}
              </h3>
              <p className="text-muted-foreground mt-1">{recommendation}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function RedFlagsSection({ flags = [] }: { flags?: RedFlag[] }) {

  const [openSections, setOpenSections] = useState<Set<RedFlagSeverity>>(
    new Set<RedFlagSeverity>(["critical", "high"])
  );

  const groupedFlags = flags.reduce((acc, flag) => {
    if (!acc[flag.severity]) acc[flag.severity] = [];
    acc[flag.severity].push(flag);
    return acc;
  }, {} as Record<RedFlagSeverity, RedFlag[]>);

  const severityOrder: RedFlagSeverity[] = ["critical", "high", "medium", "low"];

  const toggleSection = (severity: RedFlagSeverity) => {
    const newSections = new Set(openSections);
    if (newSections.has(severity)) {
      newSections.delete(severity);
    } else {
      newSections.add(severity);
    }
    setOpenSections(newSections);
  };

  if (flags.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <p className="text-muted-foreground">No red flags detected</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {severityOrder.map((severity) => {
        const severityFlags = groupedFlags[severity];
        if (!severityFlags || severityFlags.length === 0) return null;

        const config = severityConfig[severity];
        const Icon = config.icon;
        const isOpen = openSections.has(severity);

        return (
          <motion.div
            key={severity}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: severityOrder.indexOf(severity) * 0.1 }}
          >
            <Collapsible open={isOpen} onOpenChange={() => toggleSection(severity)}>
              <Card className={`border ${config.bgColor}`}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <Icon className={`w-5 h-5 ${config.color}`} />
                        <CardTitle className="text-base font-medium">
                          {config.label} Risk
                        </CardTitle>
                        <Badge variant="secondary" className="text-xs">
                          {severityFlags.length}
                        </Badge>
                      </div>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 pb-4 px-4">
                    <ul className="space-y-2">
                      {severityFlags.map((flag, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-sm text-foreground/80"
                        >
                          <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${config.color.replace("text-", "bg-")}`} />
                          {flag.message}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </motion.div>
        );
      })}
    </div>
  );
}

function AnalysisCategoryCard({
  title,
  icon: Icon,
  score,
  flags,
  delay,
}: {
  title: string;
  icon: typeof FileText;
  score: number;
  flags: string[];
  delay: number;
}) {
  const getScoreColor = (score: number) => {
    if (score >= 50) return "text-red-600 dark:text-red-400";
    if (score >= 30) return "text-amber-600 dark:text-amber-400";
    if (score >= 15) return "text-orange-600 dark:text-orange-400";
    return "text-green-600 dark:text-green-400";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Icon className="w-5 h-5 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">{title}</CardTitle>
            </div>
            <span className={`text-lg font-bold ${getScoreColor(score)}`}>
              {score}
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {flags.length > 0 ? (
            <ul className="space-y-1.5">
              {flags.slice(0, 3).map((flag, idx) => (
                <li
                  key={idx}
                  className="text-xs text-muted-foreground flex items-start gap-2"
                >
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-muted-foreground flex-shrink-0" />
                  <span className="line-clamp-2">{flag}</span>
                </li>
              ))}
              {flags.length > 3 && (
                <li className="text-xs text-muted-foreground/60">
                  +{flags.length - 3} more...
                </li>
              )}
            </ul>
          ) : (
            <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              No issues found
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ResultsDisplay({ result }: { result: AnalysisResult }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardContent className="p-6">
              <RiskScoreCircle score={result.ghostScore} riskLevel={result.riskLevel} />
              <div className="text-center mt-4">
                <Badge
                  variant="secondary"
                  className={`${riskLevelConfig[result.riskLevel]?.textColor || ""}`}
                >
                  {result.confidence}% Confidence
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="lg:col-span-2">
          <RecommendationPanel
            recommendation={result.recommendation}
            riskLevel={result.riskLevel}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnalysisCategoryCard
          title="Content Analysis"
          icon={FileText}
          score={result.detailedAnalysis?.contentAnalysis?.score ?? 0}
          flags={result.detailedAnalysis?.contentAnalysis?.flags ?? []}
          delay={0.4}
        />
        <AnalysisCategoryCard
          title="Content Analysis"
          icon={FileText}
          score={result.detailedAnalysis?.contentAnalysis?.score ?? 0}
          flags={result.detailedAnalysis?.contentAnalysis?.flags ?? []}
          delay={0.4}
        />
        <AnalysisCategoryCard
          title="Posting Patterns"
          icon={Clock}
          score={result.detailedAnalysis?.postingPatterns?.score ?? 0}
          flags={result.detailedAnalysis?.postingPatterns?.flags ?? []}
          delay={0.6}
        />
        <AnalysisCategoryCard
          title="Communication"
          icon={MessageSquare}
          score={result.detailedAnalysis?.communication?.score ?? 0}
          flags={result.detailedAnalysis?.communication?.flags ?? []}
          delay={0.7}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <h3 className="text-lg font-semibold mb-4">Detected Red Flags</h3>
        <RedFlagsSection flags={result.redFlags} />
      </motion.div>
    </motion.div>
  );
}

function JobInputForm({
  onAnalyze,
  isLoading,
}: {
  onAnalyze: (data: JobPosting) => void;
  isLoading: boolean;
}) {
  const form = useForm<JobPosting>({
    resolver: zodResolver(jobPostingSchema),
    defaultValues: {
      title: "",
      company: "",
      description: "",
      salary: undefined,
      requirements: "",
      contactEmail: "",
      companyWebsite: "",
      postingDate: "",
      contactMethod: undefined,
      responseTime: undefined,
    },
  });

  const onSubmit = (data: JobPosting) => {
    onAnalyze(data);
  };

  const loadExample = () => {
    form.setValue("title", "Marketing Manager - Work From Home!");
    form.setValue("company", "Success Unlimited LLC");
    form.setValue(
      "description",
      "Make $150,000+ working just 10 hours per week! No experience needed - we train everyone. This is a ground-floor opportunity to join our revolutionary team. Send $50 for training materials to get started immediately. Unlimited income potential! Get rich quick with our proven system. Must be 18+ to apply."
    );
    form.setValue("salary", 150000);
    form.setValue("requirements", "Must be 18+ and have internet access. Anyone can apply!");
    form.setValue("contactEmail", "opportunities123@gmail.com");
    form.setValue("companyWebsite", "");
    form.setValue("contactMethod", "text_only");
    form.setValue("responseTime", 0.5);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-xl">Analyze Job Posting</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={loadExample}
            type="button"
            data-testid="button-load-example"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Load Example
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="manual" data-testid="tab-manual-entry">
              <FileText className="w-4 h-4 mr-2" />
              Manual Entry
            </TabsTrigger>
            <TabsTrigger value="url" data-testid="tab-url-entry" disabled>
              <ExternalLink className="w-4 h-4 mr-2" />
              From URL
            </TabsTrigger>
          </TabsList>

          <TabsContent value="url">
            <div className="text-center py-8 text-muted-foreground">
              <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>URL analysis coming soon!</p>
              <p className="text-sm mt-1">
                Use manual entry to analyze job postings for now.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="manual">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Title *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Software Engineer"
                            {...field}
                            data-testid="input-job-title"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Acme Corp"
                            {...field}
                            data-testid="input-company"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Description *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Paste the full job description here..."
                          className="min-h-32 resize-y"
                          {...field}
                          data-testid="textarea-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="salary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Salary (Annual USD)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="e.g., 80000"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value ? Number(e.target.value) : undefined
                              )
                            }
                            data-testid="input-salary"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="e.g., hr@company.com"
                            {...field}
                            data-testid="input-email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="requirements"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Requirements</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="List job requirements and qualifications..."
                          className="min-h-20 resize-y"
                          {...field}
                          data-testid="textarea-requirements"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="companyWebsite"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Website</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://..."
                            {...field}
                            data-testid="input-website"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contactMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Method</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-contact-method">
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="phone">Phone</SelectItem>
                            <SelectItem value="text_only">Text Only</SelectItem>
                            <SelectItem value="in_person">In Person</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="responseTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Response Time (hours)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.5"
                            placeholder="e.g., 24"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value ? Number(e.target.value) : undefined
                              )
                            }
                            data-testid="input-response-time"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={isLoading}
                  data-testid="button-analyze"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5 mr-2" />
                      Analyze Job Posting
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default function Home() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();

  const analyzeMutation = useMutation({
    mutationFn: async (data: JobPosting) => {
      const response = await apiRequest("POST", "/api/analyze", data);
      return response as unknown as AnalysisResult;
    },
    onSuccess: (data) => {
      setResult(data);
    },
  });

  const handleNewAnalysis = () => {
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-16">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-lg font-semibold">Ghost Job Detector</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  Protect yourself from fake job postings
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {result && (
                <Button
                  variant="outline"
                  onClick={handleNewAnalysis}
                  data-testid="button-new-analysis"
                >
                  New Analysis
                </Button>
              )}
              {isAuthenticated && (
                <Link href="/history">
                  <Button
                    variant="ghost"
                    size="icon"
                    data-testid="button-history"
                  >
                    <History className="w-4 h-4" />
                  </Button>
                </Link>
              )}
              <ThemeToggle />
              {authLoading ? (
                <Button variant="ghost" size="icon" disabled>
                  <Loader2 className="w-4 h-4 animate-spin" />
                </Button>
              ) : isAuthenticated && user ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground hidden sm:block">
                    {user.firstName || user.email?.split("@")[0]}
                  </span>
                  <a href="/api/logout">
                    <Button
                      variant="ghost"
                      size="icon"
                      data-testid="button-logout"
                    >
                      <LogOut className="w-4 h-4" />
                    </Button>
                  </a>
                </div>
              ) : (
                <a href="/api/login">
                  <Button
                    variant="outline"
                    size="sm"
                    data-testid="button-login"
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign In
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="text-center max-w-2xl mx-auto">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Is That Job Real?
                </h2>
                <p className="mt-4 text-lg text-muted-foreground">
                  Our AI-powered detector analyzes job postings for red flags,
                  scam indicators, and signs of "ghost jobs" that companies post
                  with no intention of hiring.
                </p>
              </div>

              <div className="max-w-3xl mx-auto">
                <JobInputForm
                  onAnalyze={analyzeMutation.mutate}
                  isLoading={analyzeMutation.isPending}
                />
              </div>

              <div className="max-w-3xl mx-auto">
                <Card className="bg-muted/30">
                  <CardContent className="p-6">
                    <h3 className="font-medium mb-4 flex items-center gap-2">
                      <Info className="w-5 h-5 text-muted-foreground" />
                      What We Check
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-muted-foreground">
                      <div className="flex items-start gap-2">
                        <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>Suspicious keywords and unrealistic promises</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Building2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>Company legitimacy and email domain matching</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>Posting age and repetitive listings</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>Communication methods and response patterns</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ResultsDisplay result={result} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="border-t mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Ghost Job Detector</span>
            </div>
            <p className="text-center sm:text-right">
              This tool provides guidance only. Always verify job opportunities
              through official channels.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
