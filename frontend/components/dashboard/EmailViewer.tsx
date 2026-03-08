"use client";

import { EmailWithPrediction } from "@/lib/gmail";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  ShieldCheck,
  Mail,
  X,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import { ShapAnalysis } from "./ShapAnalysis";

interface EmailViewerProps {
  email: EmailWithPrediction | null;
  onBack?: () => void;
}

export function EmailViewer({ email, onBack }: EmailViewerProps) {
  if (!email) {
    return null;
  }

  const isPhishing = email.prediction?.label === "phishing";
  const confidence = email.prediction?.confidence || 0;
  const severity = email.prediction?.severity || "low";
  const hasAnalysis = !!email.prediction;

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-900 flex flex-col h-full">
      {/* Header Bar with Close Button */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Email Details
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-8 w-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-4xl mx-auto p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-6"
        >
          {/* BERT Verdict Card */}
          <PredictionCard
            label={email.prediction?.label}
            confidence={confidence}
            severity={severity}
            isAnalyzing={!hasAnalysis}
          />

          {/* SHAP Analysis - Only show if analyzed */}
          {hasAnalysis && (
            <ShapAnalysis
              topTokens={email.prediction?.top_tokens}
              label={email.prediction?.label || "legitimate"}
            />
          )}

          {/* Email Header */}
          <Card className="p-3 sm:p-4 md:p-6 overflow-hidden">
            <div className="space-y-3 sm:space-y-4">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white break-words" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                {email.subject || "(No subject)"}
              </h1>

              {/* Sender Info */}
              <div className="flex items-start gap-2 sm:gap-3 pb-3 sm:pb-4 border-b border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold flex-shrink-0 text-xs sm:text-sm">
                  {email.from.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-2 overflow-hidden">
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white break-all" style={{ wordBreak: 'break-all', overflowWrap: 'anywhere' }}>
                        {email.from}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 break-all" style={{ wordBreak: 'break-all', overflowWrap: 'anywhere' }}>
                        to {email.to}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 whitespace-nowrap">
                      {formatShortDate(email.date)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Email Body */}
          <Card className="p-3 sm:p-4 md:p-6 overflow-hidden">
            <div
              className="email-content max-w-none text-sm sm:text-base"
              style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
              dangerouslySetInnerHTML={{
                __html: formatEmailBody(email.body),
              }}
            />
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

interface PredictionCardProps {
  label?: string;
  confidence: number;
  severity: string;
  isAnalyzing?: boolean;
}

function PredictionCard({ label, confidence, severity, isAnalyzing }: PredictionCardProps) {
  const isPhishing = label === "phishing";
  const percentage = Math.round(confidence * 100);

  if (isAnalyzing) {
    return (
      <Card className="p-6 bg-gray-50 dark:bg-gray-800/50 border-2 border-dashed border-gray-300 dark:border-gray-600">
        <div className="flex items-center justify-center space-x-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Analyzing email...
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Running ML model to detect phishing
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (isPhishing) {
    const severityConfig = {
      high: {
        color: "from-red-500 to-red-600",
        textColor: "text-red-700 dark:text-red-300",
        bgColor: "bg-red-50 dark:bg-red-900/20",
        borderColor: "border-red-200 dark:border-red-800",
      },
      medium: {
        color: "from-orange-500 to-orange-600",
        textColor: "text-orange-700 dark:text-orange-300",
        bgColor: "bg-orange-50 dark:bg-orange-900/20",
        borderColor: "border-orange-200 dark:border-orange-800",
      },
      low: {
        color: "from-yellow-500 to-yellow-600",
        textColor: "text-yellow-700 dark:text-yellow-300",
        bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
        borderColor: "border-yellow-200 dark:border-yellow-800",
      },
    };

    const config = severityConfig[severity as keyof typeof severityConfig];

    return (
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card className={`${config.bgColor} border-2 ${config.borderColor} p-6`}>
          <div className="flex items-start space-x-4">
            <div className={`w-12 h-12 bg-gradient-to-br ${config.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
              <AlertTriangle className="w-7 h-7 text-white" />
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className={`text-lg font-bold ${config.textColor}`}>
                  Phishing Detected
                </h3>
                <Badge
                  className={`${config.bgColor} ${config.textColor} border ${config.borderColor} uppercase font-bold`}
                >
                  {severity} Risk
                </Badge>
              </div>

              <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                This email has been identified as a potential phishing attempt by
                our AI system. Exercise caution and do not click on any links or
                download attachments.
              </p>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Confidence Level
                    </span>
                    <span className={`text-sm font-bold ${config.textColor}`}>
                      {percentage}%
                    </span>
                  </div>
                  <div className="w-full h-3 bg-white dark:bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className={`h-full bg-gradient-to-r ${config.color}`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  // Legitimate email
  return (
    <motion.div
      initial={{ scale: 0.95 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 p-6">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-green-700 dark:text-green-300">
                  Email Verified Safe
                </h3>
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800">
                LEGITIMATE
              </Badge>
            </div>

            <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
              Our AI analysis indicates this email appears to be legitimate and
              safe to interact with.
            </p>

            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Confidence Level
                  </span>
                  <span className="text-sm font-bold text-green-700 dark:text-green-300">
                    {percentage}%
                  </span>
                </div>
                <div className="w-full h-3 bg-white dark:bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-green-500 to-green-600"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function formatEmailBody(body: string): string {
  if (!body) return "<p class='text-gray-500'>No content</p>";

  // Check if it's HTML email
  const isHTML = body.includes("<html") || body.includes("<!DOCTYPE") || body.includes("<div") || body.includes("<p");

  if (isHTML) {
    // Clean up HTML and neutralize styles that cause gaps
    let cleaned = body
      // Remove excessive whitespace between tags
      .replace(/>\s+</g, '><')
      // Remove empty paragraphs
      .replace(/<p>\s*<\/p>/g, '')
      // Remove style tags that might cause issues
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      // Remove head tags
      .replace(/<head[\s\S]*?<\/head>/gi, '');
    
    // Wrap with container that handles overflow and breaks
    return `<div class="email-content" style="word-break: break-word; overflow-wrap: anywhere; max-width: 100%;">${cleaned}</div>`;
  }

  // For plain text emails, preserve formatting and make URLs clickable
  let formatted = body;
  
  // Make URLs clickable
  const urlRegex = /(https?:\/\/[^\s<>"]+)/g;
  formatted = formatted.replace(urlRegex, (url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline" style="word-break: break-all;">${url}</a>`;
  });
  
  // Convert line breaks to <br> tags, but collapse multiple breaks
  formatted = formatted.replace(/\n{3,}/g, '<br><br>');
  formatted = formatted.replace(/\n/g, "<br />");

  return `<div style="white-space: pre-wrap; word-break: break-word; overflow-wrap: anywhere; max-width: 100%; font-family: inherit; line-height: 1.6;">${formatted}</div>`;
}

function formatShortDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    }
    
    // Check if it's within the last 7 days
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffDays < 7) {
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    }
    
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  } catch {
    return dateString;
  }
}

function formatFullDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return dateString;
  }
}
