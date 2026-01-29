"use client";

import { EmailWithPrediction } from "@/lib/gmail";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, ShieldCheck, AlertTriangle, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";

interface EmailListProps {
  emails: EmailWithPrediction[];
  selectedEmail: EmailWithPrediction | null;
  onSelectEmail: (email: EmailWithPrediction) => void;
  loading: boolean;
  error: string | null;
  hasMore?: boolean;
  onLoadMore?: () => void;
  loadingMore?: boolean;
}

export function EmailList({
  emails,
  selectedEmail,
  onSelectEmail,
  loading,
  error,
  hasMore = false,
  onLoadMore,
  loadingMore = false,
}: EmailListProps) {
  if (loading) {
    return (
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-full">
        {/* List Header Skeleton */}
        <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex-shrink-0">
          <Skeleton className="h-6 w-24" />
        </div>
        
        {/* Email List Skeletons */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="flex items-start gap-3">
                <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-96 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-center h-full">
          <div className="text-center space-y-3">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
            <p className="text-sm text-gray-600 dark:text-gray-400">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="w-96 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-center h-full">
          <div className="text-center space-y-3">
            <ShieldCheck className="w-12 h-12 text-green-500 mx-auto" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              No emails to display
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-full overflow-hidden">
      {/* List Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex-shrink-0">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Inbox
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {emails.map((email, index) => (
            <motion.div
              key={email.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="overflow-hidden"
            >
              <EmailListItem
                email={email}
                isSelected={selectedEmail?.id === email.id}
                onSelect={() => onSelectEmail(email)}
              />
            </motion.div>
          ))}
        </div>

        {/* Load More Button */}
        {hasMore && (
          <div className="p-3 sm:p-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              className="w-full h-9 sm:h-10 text-sm"
              onClick={onLoadMore}
              disabled={loadingMore}
            >
              {loadingMore ? (
                <>
                  <div className="animate-spin rounded-full h-3.5 w-3.5 sm:h-4 sm:w-4 border-b-2 border-blue-600 mr-2"></div>
                  <span className="text-xs sm:text-sm">Loading...</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2" />
                  <span className="text-xs sm:text-sm">View More</span>
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

interface EmailListItemProps {
  email: EmailWithPrediction;
  isSelected: boolean;
  onSelect: () => void;
}

function EmailListItem({ email, isSelected, onSelect }: EmailListItemProps) {
  const isPhishing = email.prediction?.label === "phishing";
  const confidence = email.prediction?.confidence || 0;
  const severity = email.prediction?.severity || "low";

  // Extract sender name and email
  const fromMatch = email.from.match(/^(.+?)\s*<(.+?)>$/) || [null, email.from, email.from];
  const senderName = fromMatch[1]?.trim() || email.from;
  const senderEmail = fromMatch[2] || email.from;

  return (
    <div
      onClick={onSelect}
      className={`px-4 py-2.5 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 overflow-hidden ${
        isSelected
          ? "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-600"
          : "border-l-4 border-l-transparent"
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-xs">
            {senderName.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* Email Content */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex items-center justify-between gap-2 mb-0.5 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate flex-1 min-w-0">
              {senderName}
            </p>
            <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 whitespace-nowrap">
              {formatDate(email.date)}
            </span>
          </div>

          <div className="flex items-center gap-2 mb-1 min-w-0">
            <h3 className="text-sm text-gray-900 dark:text-white truncate flex-1 min-w-0">
              {email.subject || "(No subject)"}
            </h3>
            <RiskBadge label={email.prediction?.label} severity={severity} compact />
          </div>

          <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
            {email.snippet}
          </p>
        </div>
      </div>
    </div>
  );
}

function RiskBadge({ label, severity, compact }: { label?: string; severity: string; compact?: boolean }) {
  if (label === "phishing") {
    const colors = {
      high: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      medium: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
      low: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    };

    return (
      <Badge className={`${colors[severity as keyof typeof colors]} px-1.5 py-0 h-5 text-xs`}>
        <AlertTriangle className="w-3 h-3" />
      </Badge>
    );
  }

  return (
    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-1.5 py-0 h-5 text-xs">
      <ShieldCheck className="w-3 h-3" />
    </Badge>
  );
}

function ConfidenceMeter({ confidence }: { confidence: number }) {
  const percentage = Math.round(confidence * 100);
  const color =
    percentage >= 90
      ? "bg-red-500"
      : percentage >= 70
      ? "bg-orange-500"
      : "bg-green-500";

  return (
    <div className="flex items-center space-x-2">
      <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
        {percentage}%
      </span>
    </div>
  );
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return dateString;
  }
}
