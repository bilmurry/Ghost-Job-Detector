import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  Shield,
  ArrowLeft,
  Trash2,
  Eye,
  Calendar,
  Building2,
  Briefcase,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Info,
  Loader2,
  LogIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import { apiRequest } from "@/lib/queryClient";
import type { Analysis } from "@shared/models/auth";
import type { AnalysisResult, JobPosting } from "@shared/schema";

const riskLevelConfig: Record<string, { color: string; bgColor: string; icon: typeof AlertTriangle }> = {
  high: {
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-900/30",
    icon: AlertTriangle,
  },
  medium: {
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
    icon: AlertCircle,
  },
  "low-medium": {
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
    icon: Info,
  },
  low: {
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    icon: CheckCircle,
  },
};

function formatDate(dateString: string | Date | null): string {
  if (!dateString) return "Unknown";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function AnalysisCard({
  analysis,
  onView,
  onDelete,
}: {
  analysis: Analysis;
  onView: (analysis: Analysis) => void;
  onDelete: (id: string) => void;
}) {
  const config = riskLevelConfig[analysis.riskLevel] || riskLevelConfig.low;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <Card className="hover-elevate">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className={`p-2 rounded-full ${config.bgColor} flex-shrink-0`}>
                <Icon className={`w-4 h-4 ${config.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm truncate" data-testid={`text-job-title-${analysis.id}`}>
                  {analysis.jobTitle}
                </h3>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                  <Building2 className="w-3 h-3" />
                  <span className="truncate" data-testid={`text-company-${analysis.id}`}>
                    {analysis.company}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <Badge variant="secondary" className={config.color}>
                    Score: {analysis.ghostScore}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {analysis.redFlagsCount} flags
                  </Badge>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(analysis.createdAt)}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onView(analysis)}
                data-testid={`button-view-${analysis.id}`}
              >
                <Eye className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(analysis.id)}
                data-testid={`button-delete-${analysis.id}`}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function AnalysisDetailDialog({
  analysis,
  open,
  onClose,
}: {
  analysis: Analysis | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!analysis) return null;

  const result = analysis.analysisResult as AnalysisResult;
  const jobPosting = analysis.jobPosting as JobPosting;
  const config = riskLevelConfig[analysis.riskLevel] || riskLevelConfig.low;
  const Icon = config.icon;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className={`w-5 h-5 ${config.color}`} />
            {analysis.jobTitle}
          </DialogTitle>
          <DialogDescription>
            {analysis.company} - Analyzed on {formatDate(analysis.createdAt)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
            <div className="text-center">
              <div className={`text-3xl font-bold ${config.color}`}>
                {analysis.ghostScore}
              </div>
              <div className="text-xs text-muted-foreground">Risk Score</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-muted-foreground">
                {analysis.confidence}%
              </div>
              <div className="text-xs text-muted-foreground">Confidence</div>
            </div>
            <div className="flex-1">
              <Badge className={`${config.bgColor} ${config.color} border-0`}>
                {analysis.riskLevel.toUpperCase()} RISK
              </Badge>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Recommendation</h4>
            <p className="text-sm text-muted-foreground">{analysis.recommendation}</p>
          </div>

          {result.redFlags && result.redFlags.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Red Flags ({result.redFlags.length})</h4>
              <ul className="space-y-1">
                {result.redFlags.map((flag, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-muted-foreground flex-shrink-0" />
                    {flag.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h4 className="font-medium mb-2">Job Details</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong>Title:</strong> {jobPosting.title}</p>
              <p><strong>Company:</strong> {jobPosting.company}</p>
              {jobPosting.salary && <p><strong>Salary:</strong> ${jobPosting.salary.toLocaleString()}</p>}
              {jobPosting.contactEmail && <p><strong>Email:</strong> {jobPosting.contactEmail}</p>}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} data-testid="button-close-dialog">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function History() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [selectedAnalysis, setSelectedAnalysis] = useState<Analysis | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: analyses, isLoading } = useQuery<Analysis[]>({
    queryKey: ["/api/analyses"],
    enabled: isAuthenticated,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/analyses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/analyses"] });
    },
  });

  const handleView = (analysis: Analysis) => {
    setSelectedAnalysis(analysis);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
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
                    Analysis History
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/">
                  <Button variant="outline" size="sm" data-testid="button-back-home">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                </Link>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <LogIn className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Sign in to view your history</h2>
              <p className="text-muted-foreground mb-4">
                Your analysis history will be saved when you're signed in.
              </p>
              <a href="/api/login">
                <Button data-testid="button-login-history">
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </Button>
              </a>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

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
                  Analysis History
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/">
                <Button variant="outline" size="sm" data-testid="button-back-home">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Your Analysis History</h2>
          <p className="text-muted-foreground">
            {user?.firstName ? `${user.firstName}'s` : "Your"} past job posting analyses
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12" data-testid="loading-analyses">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : analyses && analyses.length > 0 ? (
          <div className="space-y-3" data-testid="analyses-list">
            <AnimatePresence>
              {analyses.map((analysis) => (
                <AnalysisCard
                  key={analysis.id}
                  analysis={analysis}
                  onView={handleView}
                  onDelete={handleDelete}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No analyses yet</h3>
              <p className="text-muted-foreground mb-4">
                Your job posting analyses will appear here.
              </p>
              <Link href="/">
                <Button data-testid="button-start-analyzing">
                  Start Analyzing
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </main>

      <AnalysisDetailDialog
        analysis={selectedAnalysis}
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setSelectedAnalysis(null);
        }}
      />
    </div>
  );
}
