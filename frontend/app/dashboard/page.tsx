"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { EmailWithPrediction } from "@/lib/gmail";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { EmailList } from "@/components/dashboard/EmailList";
import { EmailViewer } from "@/components/dashboard/EmailViewer";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getApiUrl, getApiModel } from "@/lib/settings";

type FilterType = "all" | "phishing" | "safe";

async function handleSessionExpired() {
  await signOut({ redirect: true, callbackUrl: "/auth/signin?expired=true" });
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [emails, setEmails] = useState<EmailWithPrediction[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailWithPrediction | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showEmailViewer, setShowEmailViewer] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [displayCount, setDisplayCount] = useState(5);
  const [analyzedIds, setAnalyzedIds] = useState<Set<string>>(new Set());
  const [analyzingBatch, setAnalyzingBatch] = useState(false);
  const [apiUrl, setApiUrl] = useState<string | null>(null);
  const [apiModel, setApiModel] = useState<string>("bert");

  const refreshApiUrl = useCallback(() => {
    setApiUrl(getApiUrl());
    setApiModel(getApiModel());
  }, []);

  useEffect(() => {
    refreshApiUrl();
  }, [refreshApiUrl]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchEmails();
    }
  }, [status]);

  const fetchEmails = async (refresh: boolean = false) => {
    try {
      if (refresh) {
        setLoading(true);
        setDisplayCount(5);
        setSelectedEmail(null);
        setAnalyzedIds(new Set());
      } else {
        setLoading(true);
      }
      setError(null);
      
      const response = await fetch("/api/emails/metadata?maxResults=30");
      
      if (response.status === 401) {
        await handleSessionExpired();
        return;
      }
      
      if (!response.ok) {
        throw new Error("Failed to fetch emails");
      }
      
      const data = await response.json();
      
      setEmails(data.emails.map((email: any) => ({
        ...email,
        prediction: null
      })));
      
      setLoading(false);
      
    } catch (err) {
      console.error("Error fetching emails:", err);
      setError("Failed to load emails. Please try again.");
      setLoading(false);
    }
  };

  const analyzeEmailBatch = async (emailsToAnalyze: any[]) => {
    if (emailsToAnalyze.length === 0) return;
    
    const currentApiUrl = getApiUrl();
    const currentApiModel = getApiModel();
    if (!currentApiUrl) return;
    
    try {
      setAnalyzingBatch(true);
      
      console.log("=== ANALYZE BATCH REQUEST ===");
      console.log("API URL:", currentApiUrl);
      console.log("Model:", currentApiModel);
      console.log("Emails to analyze:", emailsToAnalyze.length);
      
      const response = await fetch(`/api/analyze-batch?apiUrl=${encodeURIComponent(currentApiUrl)}&model=${encodeURIComponent(currentApiModel)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ emails: emailsToAnalyze }),
      });
      
      console.log("Response status:", response.status);
      
      if (response.status === 401) {
        await handleSessionExpired();
        return;
      }
      
      if (!response.ok) {
        throw new Error("Failed to analyze emails");
      }
      
      const { results } = await response.json();
      
      console.log("=== ANALYZE BATCH RESPONSE ===");
      console.log("Results:", JSON.stringify(results, null, 2));
      console.log("=============================");
      
      // Update emails with predictions
      setEmails(prevEmails => {
        const updatedEmails = [...prevEmails];
        results.forEach((result: any) => {
          const index = updatedEmails.findIndex(e => e.id === result.id);
          if (index !== -1) {
            updatedEmails[index] = {
              ...updatedEmails[index],
              prediction: result.prediction
            };
          }
        });
        return updatedEmails;
      });
      
      // Mark these as analyzed
      setAnalyzedIds(prev => {
        const newSet = new Set(prev);
        results.forEach((r: any) => newSet.add(r.id));
        return newSet;
      });
      
    } catch (err) {
      console.error("Error analyzing batch:", err);
    } finally {
      setAnalyzingBatch(false);
    }
  };

  const handleLoadMore = () => {
    const newDisplayCount = displayCount + 5;
    setDisplayCount(newDisplayCount);
  };

  const filteredEmails = emails.filter((email) => {
    if (filter === "all") return true;
    if (filter === "phishing") return email.prediction?.label === "phishing";
    if (filter === "safe") return email.prediction?.label === "legitimate";
    return true;
  });

  const displayedEmails = filteredEmails.slice(0, displayCount);
  const hasMore = displayCount < filteredEmails.length;

  const handleEmailSelect = async (email: EmailWithPrediction) => {
    setSelectedEmail(email);
    setShowEmailViewer(true);
    
    // Analyze the email to get SHAP values
    const currentApiUrl = getApiUrl();
    const currentApiModel = getApiModel();
    
    console.log("=== ANALYZE EMAIL REQUEST ===");
    console.log("API URL:", currentApiUrl);
    console.log("API Model:", currentApiModel);
    console.log("Email subject:", email.subject);
    console.log("Email from:", email.from);
    
    if (!currentApiUrl) {
      console.log("No API URL configured");
      // Set prediction with error so UI shows proper message
      setEmails(prevEmails => {
        const index = prevEmails.findIndex(e => e.id === email.id);
        if (index !== -1) {
          const updated = [...prevEmails];
          updated[index] = {
            ...updated[index],
            prediction: {
              label: "legitimate",
              confidence: 0,
              severity: "low",
              phishing_type: null,
              error: "API URL not configured. Please set it in Settings.",
            }
          };
          return updated;
        }
        return prevEmails;
      });
      setSelectedEmail(prev => prev ? {
        ...prev,
        prediction: {
          label: "legitimate",
          confidence: 0,
          severity: "low",
          phishing_type: null,
          error: "API URL not configured. Please set it in Settings.",
        }
      } : null);
      return;
    }
    
    // Always analyze when clicking (for SHAP values)
    const response = await fetch(`/api/analyze-batch?apiUrl=${encodeURIComponent(currentApiUrl)}&model=${encodeURIComponent(currentApiModel)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ emails: [email] }),
    });
    
    console.log("Response status:", response.status);
    
    if (response.status === 401) {
      await handleSessionExpired();
      return;
    }
    
    if (response.ok) {
      const { results } = await response.json();
      
      console.log("=== ANALYZE EMAIL RESPONSE ===");
      console.log("Result:", JSON.stringify(results, null, 2));
      console.log("==============================");
      
      const prediction = results[0]?.prediction;
      
      console.log("Prediction result:", prediction);
      
      setEmails(prevEmails => {
        const index = prevEmails.findIndex(e => e.id === email.id);
        if (index !== -1) {
          const updated = [...prevEmails];
          updated[index] = { ...updated[index], prediction };
          return updated;
        }
        return prevEmails;
      });
      
      setSelectedEmail(prev => prev ? { ...prev, prediction } : null);
    } else {
      console.error("Analysis failed:", response.status);
    }
  };

  const handleBackToList = () => {
    setShowEmailViewer(false);
    // On desktop, also deselect the email to close the viewer
    if (window.innerWidth >= 768) {
      setSelectedEmail(null);
    }
  };

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const emailCounts = {
    all: emails.length,
    phishing: emails.filter((e) => e.prediction?.label === "phishing").length,
    safe: emails.filter((e) => e.prediction?.label === "legitimate").length,
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardHeader 
        user={session?.user} 
        onRefresh={() => fetchEmails(true)}
        onMenuClick={() => setMobileMenuOpen(true)}
        onSettingsChange={refreshApiUrl}
      />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <Sidebar
            filter={filter}
            onFilterChange={setFilter}
            emailCounts={emailCounts}
            collapsed={sidebarCollapsed}
            onCollapsedChange={setSidebarCollapsed}
          />
        </div>

        {/* Mobile Sidebar */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="p-0 w-64">
            <Sidebar
              filter={filter}
              onFilterChange={(newFilter) => {
                setFilter(newFilter);
                setMobileMenuOpen(false);
              }}
              emailCounts={emailCounts}
            />
          </SheetContent>
        </Sheet>
        
        {/* Email List - Hidden on mobile when email is selected */}
        <div className={`${showEmailViewer ? 'hidden' : 'flex'} ${selectedEmail ? 'md:max-w-md lg:max-w-lg' : 'flex-1'} md:flex overflow-hidden`}>
          <EmailList
            emails={displayedEmails}
            selectedEmail={selectedEmail}
            onSelectEmail={handleEmailSelect}
            loading={loading}
            error={error}
            hasMore={hasMore}
            onLoadMore={handleLoadMore}
            loadingMore={loadingMore}
          />
        </div>
        
        {/* Email Viewer - Only show when email is selected */}
        {selectedEmail && (
          <div className={`flex-1 ${showEmailViewer ? 'flex' : 'hidden md:flex'} overflow-hidden`}>
            <EmailViewer 
              email={selectedEmail}
              onBack={handleBackToList}
            />
          </div>
        )}
      </div>
    </div>
  );
}
