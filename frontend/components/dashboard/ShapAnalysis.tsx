"use client";

import { TokenScore } from "@/lib/gmail";
import { Card } from "@/components/ui/card";
import { AlertTriangle, ShieldCheck, TrendingUp, Info } from "lucide-react";
import { motion } from "framer-motion";

interface ShapAnalysisProps {
  topTokens?: TokenScore[];
  label: string;
}

export function ShapAnalysis({ topTokens, label }: ShapAnalysisProps) {
  if (!topTokens || topTokens.length === 0) {
    return (
      <Card className="p-4 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <Info className="w-4 h-4" />
          <span className="text-sm">No token analysis available</span>
        </div>
      </Card>
    );
  }

  const isPhishing = label === "phishing";
  
  const phishingTokens = topTokens
    .filter(t => t.shap_score > 0)
    .sort((a, b) => b.shap_score - a.shap_score)
    .slice(0, 10);
  
  const safeTokens = topTokens
    .filter(t => t.shap_score < 0)
    .sort((a, b) => a.shap_score - b.shap_score)
    .slice(0, 10);

  const maxScore = Math.max(...topTokens.map(t => Math.abs(t.shap_score)), 0.01);

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4" />
        <h4 className="text-sm font-semibold">SHAP Token Analysis</h4>
      </div>

      {/* Phishing Indicators */}
      {phishingTokens.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
            <AlertTriangle className="w-3 h-3" />
            <span className="font-medium">Contributes to Phishing</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {phishingTokens.map((token, idx) => (
              <motion.span
                key={idx}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="inline-flex items-center px-2 py-1 rounded text-xs font-medium text-red-950 dark:text-red-100"
                style={{
                  backgroundColor: `rgba(239, 68, 68, ${Math.min(Math.abs(token.shap_score) / maxScore + 0.2, 1)})`,
                }}
                title={`SHAP: ${token.shap_score.toFixed(4)}`}
              >
                {token.token}
                <span className="ml-1 opacity-60 text-[10px] dark:opacity-80">
                  {token.shap_score.toFixed(2)}
                </span>
              </motion.span>
            ))}
          </div>
        </div>
      )}

      {/* Safe Indicators */}
      {safeTokens.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
            <ShieldCheck className="w-3 h-3" />
            <span className="font-medium">Contributes to Legitimate</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {safeTokens.map((token, idx) => (
              <motion.span
                key={idx}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="inline-flex items-center px-2 py-1 rounded text-xs font-medium text-green-950 dark:text-green-100"
                style={{
                  backgroundColor: `rgba(34, 197, 94, ${Math.min(Math.abs(token.shap_score) / maxScore + 0.2, 1)})`,
                }}
                title={`SHAP: ${token.shap_score.toFixed(4)}`}
              >
                {token.token}
                <span className="ml-1 opacity-60 text-[10px] dark:opacity-80">
                  {token.shap_score.toFixed(2)}
                </span>
              </motion.span>
            ))}
          </div>
        </div>
      )}

    </Card>
  );
}
