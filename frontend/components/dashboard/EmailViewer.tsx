"use client";

import { EmailWithPrediction } from "@/lib/gmail";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  ShieldCheck,
  X,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import { ShapAnalysis } from "./ShapAnalysis";
import { useEffect, useRef, useState } from "react";

interface EmailViewerProps {
  email: EmailWithPrediction | null;
  onBack?: () => void;
}

export function EmailViewer({ email, onBack }: EmailViewerProps) {
  if (!email) return null;

  const confidence = email.prediction?.confidence || 0;
  const severity = email.prediction?.severity || "low";
  const hasAnalysis = !!email.prediction && !email.prediction?.error;
  const error = email.prediction?.error;

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-900 flex flex-col h-full">
      {/* Header */}
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
          className="w-full max-w-4xl mx-auto p-4 sm:p-6 space-y-4"
        >
          {/* Verdict Card */}
          <PredictionCard
            label={email.prediction?.label}
            confidence={confidence}
            severity={severity}
            isAnalyzing={!hasAnalysis && !error}
            error={error}
          />

          {/* SHAP Analysis */}
          {hasAnalysis && (
            <ShapAnalysis
              topTokens={email.prediction?.top_tokens}
              label={email.prediction?.label || "legitimate"}
            />
          )}

          {/* Email Card — Gmail-style */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            {/* Email Header */}
            <div className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-700">
              <h1
                className="text-xl font-semibold text-gray-900 dark:text-white mb-4 leading-snug"
                style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}
              >
                {email.subject || "(No subject)"}
              </h1>

              {/* Sender row */}
              <div className="flex items-start gap-3">
                <SenderAvatar name={email.from} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {extractName(email.from)}
                    </p>
                    <p className="text-xs text-gray-400 flex-shrink-0">
                      {formatShortDate(email.date)}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                    {email.from}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    to {email.to}
                  </p>
                </div>
              </div>
            </div>

            {/* Email Body */}
            <div className="px-6 py-5">
              <EmailBody body={email.body} />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ─── Sender Avatar ──────────────────────────────────────────────────────────

function SenderAvatar({ name }: { name: string }) {
  const initials = extractInitials(name);
  const color = stringToColor(name);
  return (
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
      style={{ backgroundColor: color }}
    >
      {initials}
    </div>
  );
}

function extractName(from: string): string {
  // "John Doe <john@example.com>" → "John Doe"
  const match = from.match(/^([^<]+)</);
  return match ? match[1].trim() : from.split("@")[0];
}

function extractInitials(from: string): string {
  const name = extractName(from);
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function stringToColor(str: string): string {
  // Deterministic color from string
  const palette = [
    "#4285F4", "#EA4335", "#FBBC05", "#34A853",
    "#9334E6", "#F66151", "#0F9D58", "#4A90D9",
    "#D93025", "#1A73E8",
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

// ─── Email Body Renderer ─────────────────────────────────────────────────────

function EmailBody({ body }: { body: string }) {
  const isHTML =
    /<(html|body|div|table|p|span|a|img|td|tr)\b/i.test(body);

  if (isHTML) {
    return <HTMLEmailBody html={body} />;
  }
  return <PlainTextEmailBody text={body} />;
}

// Renders HTML emails in a sandboxed iframe — styles can't bleed out
function HTMLEmailBody({ html }: { html: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(400);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    // Write into the iframe's document
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    // Inject base styles that mimic Gmail's email rendering defaults
    const wrappedHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            * { box-sizing: border-box; }
            html, body {
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
              font-size: 14px;
              line-height: 1.6;
              color: #202124;
              background: transparent;
              word-break: break-word;
              overflow-wrap: anywhere;
            }
            body { padding: 4px 0; }
            a { color: #1a73e8; text-decoration: underline; }
            a:hover { opacity: 0.8; }
            img { max-width: 100%; height: auto; display: block; }
            table { border-collapse: collapse; max-width: 100%; }
            td, th { vertical-align: top; }
            blockquote {
              border-left: 4px solid #d0e4ff;
              margin: 12px 0;
              padding: 8px 16px;
              color: #5f6368;
              background: #f8faff;
              border-radius: 0 6px 6px 0;
            }
            pre, code {
              font-family: 'Courier New', monospace;
              font-size: 13px;
              background: #f1f3f4;
              padding: 2px 6px;
              border-radius: 4px;
              white-space: pre-wrap;
            }
            /* Remove large top margins from email templates */
            body > table:first-child,
            body > div:first-child { margin-top: 0 !important; }
          </style>
        </head>
        <body>${sanitizeHTML(html)}</body>
      </html>
    `;

    doc.open();
    doc.write(wrappedHTML);
    doc.close();

    // Auto-resize the iframe to fit content
    const resize = () => {
      try {
        const h = doc.documentElement?.scrollHeight || doc.body?.scrollHeight || 400;
        setHeight(h + 16);
      } catch {
        setHeight(400);
      }
    };

    // Resize after images load
    iframe.onload = resize;
    setTimeout(resize, 100);
    setTimeout(resize, 500);
  }, [html]);

  return (
    <iframe
      ref={iframeRef}
      sandbox="allow-same-origin allow-popups"
      className="w-full border-0 rounded-lg"
      style={{ height, minHeight: 120 }}
      title="Email content"
    />
  );
}

// Renders plain-text emails with proper formatting
function PlainTextEmailBody({ text }: { text: string }) {
  const lines = formatPlainText(text);

  return (
    <div className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed space-y-1 font-sans">
      {lines.map((block, i) => {
        switch (block.type) {
          case "blank":
            return <div key={i} className="h-3" />;

          case "heading":
            return (
              <p key={i} className="font-semibold text-gray-900 dark:text-white text-base mt-3">
                {block.content}
              </p>
            );

          case "bullet":
            return (
              <div key={i} className="flex items-start gap-2 pl-2">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                <span>{renderInlineLinks(block.content)}</span>
              </div>
            );

          case "quote":
            return (
              <blockquote
                key={i}
                className="border-l-4 border-blue-200 dark:border-blue-700 pl-3 py-1 text-gray-500 dark:text-gray-400 italic bg-blue-50/50 dark:bg-blue-900/20 rounded-r"
              >
                {renderInlineLinks(block.content)}
              </blockquote>
            );

          case "divider":
            return <hr key={i} className="border-gray-100 dark:border-gray-700 my-3" />;

          case "link":
            return (
              <a
                key={i}
                href={block.content}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 underline"
                title={block.content}
              >
                {friendlyUrl(block.content)}
              </a>
            );

          case "footer":
            return (
              <p key={i} className="text-xs text-gray-400 dark:text-gray-500">
                {renderInlineLinks(block.content)}
              </p>
            );

          default:
            return (
              <p key={i} className="text-gray-800 dark:text-gray-200">
                {renderInlineLinks(block.content)}
              </p>
            );
        }
      })}
    </div>
  );
}

// Shorten a URL to a human-readable label: "example.com/page"
function friendlyUrl(url: string): string {
  try {
    const { hostname, pathname } = new URL(url);
    const host = hostname.replace(/^www\./, "");
    const path = pathname.replace(/\/$/, ""); // strip trailing slash
    // Truncate long paths
    const shortPath = path.length > 30 ? path.slice(0, 30) + "…" : path;
    return host + (shortPath && shortPath !== "/" ? shortPath : "");
  } catch {
    return url.length > 50 ? url.slice(0, 50) + "…" : url;
  }
}

// Render inline links within a line of text
function renderInlineLinks(text: string): React.ReactNode {
  const parts = text.split(/(https?:\/\/[^\s]+)/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 dark:text-blue-400 underline"
        title={part}
        onClick={(e) => e.stopPropagation()}
      >
        {friendlyUrl(part)}
      </a>
    ) : (
      part
    )
  );
}

// ─── Plain-text parsing ──────────────────────────────────────────────────────

type TextBlock = {
  type: "paragraph" | "heading" | "bullet" | "quote" | "divider" | "blank" | "link" | "footer";
  content: string;
};

const FOOTER_PATTERNS = [
  /^(unsubscribe|view in browser|manage preferences|privacy policy|terms of service|©|copyright|\(c\) \d{4})/i,
  /^sent (from|with|via)/i,
  /^you('re| are) receiving this/i,
  /^this (email|message) was sent/i,
];

function isFooterLine(line: string): boolean {
  return FOOTER_PATTERNS.some((p) => p.test(line));
}

function formatPlainText(raw: string): TextBlock[] {
  // Pre-process common email link patterns so they stay inline
  let normalized = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // 1. Markdown-style: [text](url) → "text url"
  normalized = normalized.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, "$1 $2");
  // 2. Angle-bracket with preceding label on same line: Label <https://...>
  normalized = normalized.replace(/([^\n<]{1,80}?)\s*<(https?:\/\/[^>\s]+)>/g, "$1 $2");
  // 3. Lone angle-bracket URLs: <https://...>
  normalized = normalized.replace(/<(https?:\/\/[^>\s]+)>/g, "$1");
  // 4. URL on next line after a short label line — merge into one line
  normalized = normalized.replace(/([^\n]{1,60})\n(https?:\/\/\S+)/g, "$1 $2");

  const lines = normalized.split("\n");
  const blocks: TextBlock[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      if (blocks.length && blocks[blocks.length - 1].type !== "blank") {
        blocks.push({ type: "blank", content: "" });
      }
      continue;
    }

    if (/^[-_=]{3,}$/.test(trimmed)) {
      blocks.push({ type: "divider", content: "" });
      continue;
    }

    // Standalone URL (no other text on the line)
    if (/^https?:\/\/\S+$/.test(trimmed)) {
      blocks.push({ type: "link", content: trimmed });
      continue;
    }

    if (isFooterLine(trimmed)) {
      blocks.push({ type: "footer", content: trimmed });
      continue;
    }

    if (/^>+\s?/.test(line)) {
      blocks.push({ type: "quote", content: trimmed.replace(/^>+\s?/, "") });
      continue;
    }

    if (/^[•\-\*]\s+/.test(trimmed)) {
      blocks.push({ type: "bullet", content: trimmed.replace(/^[•\-\*]\s+/, "") });
      continue;
    }

    if (/^\d+[.)]\s+/.test(trimmed)) {
      blocks.push({ type: "bullet", content: trimmed.replace(/^\d+[.)]\s+/, "") });
      continue;
    }

    // Heading: all-caps short line (but not a URL), or ends with colon
    if (
      (trimmed === trimmed.toUpperCase() && trimmed.length > 3 && trimmed.length < 60 &&
        /[A-Z]/.test(trimmed) && !/https?:\/\//.test(trimmed)) ||
      (trimmed.endsWith(":") && trimmed.length < 60 && trimmed.includes(" "))
    ) {
      blocks.push({ type: "heading", content: trimmed });
      continue;
    }

    blocks.push({ type: "paragraph", content: trimmed });
  }

  while (blocks.length && blocks[blocks.length - 1].type === "blank") {
    blocks.pop();
  }

  return blocks;
}

// ─── HTML Sanitizer (strip scripts/tracking, keep layout) ───────────────────

function sanitizeHTML(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, (match) => {
      // Keep styles but remove tracking-related ones
      return match.replace(/url\(['"]?https?:\/\/[^'")\s]+['"]?\)/g, "");
    })
    .replace(/<img([^>]*?)src=['"]?(https?:\/\/[^'">\s]+)['"]?([^>]*?)>/gi,
      (_, pre, src, post) => {
        // Keep images but strip tracking pixels (1x1)
        if (/width=['"]?1['"]?|height=['"]?1['"]?/.test(pre + post)) return "";
        return `<img${pre}src="${src}"${post}>`;
      }
    )
    .replace(/on\w+="[^"]*"/gi, "") // Remove inline event handlers
    .replace(/javascript:/gi, "about:"); // Neutralize JS links
}

// ─── Prediction Card (unchanged logic, cleaned up) ──────────────────────────

interface PredictionCardProps {
  label?: string;
  confidence: number;
  severity: string;
  isAnalyzing?: boolean;
  error?: string;
}

function PredictionCard({ label, confidence, severity, isAnalyzing, error }: PredictionCardProps) {
  const isPhishing = label === "phishing";
  const percentage = Math.round(confidence * 100);

  if (isAnalyzing) {
    return (
      <Card className="p-6 bg-gray-50 dark:bg-gray-800/50 border-2 border-dashed border-gray-300 dark:border-gray-600">
        <div className="flex items-center justify-center space-x-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Analyzing email...</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Running ML model to detect phishing</p>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-amber-700 dark:text-amber-300">Analysis Unavailable</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">{error}</p>
          </div>
        </div>
      </Card>
    );
  }

  const severityConfig = {
    high:   { color: "from-red-500 to-red-600",    text: "text-red-700 dark:text-red-300",       bg: "bg-red-50 dark:bg-red-900/20",       border: "border-red-200 dark:border-red-800" },
    medium: { color: "from-orange-500 to-orange-600", text: "text-orange-700 dark:text-orange-300", bg: "bg-orange-50 dark:bg-orange-900/20", border: "border-orange-200 dark:border-orange-800" },
    low:    { color: "from-yellow-500 to-yellow-600", text: "text-yellow-700 dark:text-yellow-300", bg: "bg-yellow-50 dark:bg-yellow-900/20", border: "border-yellow-200 dark:border-yellow-800" },
  };

  if (isPhishing) {
    const cfg = severityConfig[severity as keyof typeof severityConfig] ?? severityConfig.low;
    return (
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} transition={{ duration: 0.3 }}>
        <Card className={`${cfg.bg} border-2 ${cfg.border} p-6`}>
          <div className="flex items-start space-x-4">
            <div className={`w-12 h-12 bg-gradient-to-br ${cfg.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
              <AlertTriangle className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className={`text-lg font-bold ${cfg.text}`}>Phishing Detected</h3>
                <Badge className={`${cfg.bg} ${cfg.text} border ${cfg.border} uppercase font-bold`}>{severity} Risk</Badge>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                This email has been identified as a potential phishing attempt. Do not click links or download attachments.
              </p>
              <ConfidenceBar percentage={percentage} colorClass={`bg-gradient-to-r ${cfg.color}`} textClass={cfg.text} />
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} transition={{ duration: 0.3 }}>
      <Card className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 p-6">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-green-700 dark:text-green-300">Email Verified Safe</h3>
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800">LEGITIMATE</Badge>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
              Our AI analysis indicates this email appears to be legitimate and safe.
            </p>
            <ConfidenceBar percentage={percentage} colorClass="bg-gradient-to-r from-green-500 to-green-600" textClass="text-green-700 dark:text-green-300" />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function ConfidenceBar({ percentage, colorClass, textClass }: { percentage: number; colorClass: string; textClass: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Confidence Level</span>
        <span className={`text-sm font-bold ${textClass}`}>{percentage}%</span>
      </div>
      <div className="w-full h-3 bg-white dark:bg-gray-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full ${colorClass}`}
        />
      </div>
    </div>
  );
}

// ─── Date Formatting ─────────────────────────────────────────────────────────

function formatShortDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
    if (diffDays < 7) return date.toLocaleDateString("en-US", { weekday: "short", hour: "numeric", minute: "2-digit", hour12: true });
    return date.toLocaleDateString("en-US", {
      month: "short", day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  } catch {
    return dateString;
  }
}