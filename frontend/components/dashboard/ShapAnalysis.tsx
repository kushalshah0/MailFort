"use client";

import { TokenScore } from "@/lib/gmail";
import { Card } from "@/components/ui/card";
import { TrendingUp, Info } from "lucide-react";
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

  // Deduplicate and sort by absolute score (most influential first)
  const uniqueTokens = topTokens
    .filter((token, index, self) => 
      index === self.findIndex(t => t.token.toLowerCase() === token.token.toLowerCase())
    )
    .sort((a, b) => Math.abs(b.shap_score) - Math.abs(a.shap_score));

  const maxScore = Math.max(...uniqueTokens.map(t => Math.abs(t.shap_score)), 0.01);

  const isPhishing = label === "phishing";

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4" />
        <h4 className="text-sm font-semibold">Token Analysis</h4>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {uniqueTokens.map((token, idx) => {
          const isPositive = token.shap_score > 0;
          const isPhishingIndicator = isPositive === isPhishing;
          
          return (
            <motion.span
              key={`${token.token}-${idx}`}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: idx * 0.03 }}
              className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                isPhishingIndicator 
                  ? "text-red-950 dark:text-red-100" 
                  : "text-green-950 dark:text-green-100"
              }`}
              style={{
                backgroundColor: isPhishingIndicator 
                  ? `rgba(239, 68, 68, ${Math.min(Math.abs(token.shap_score) / maxScore + 0.2, 1)})`
                  : `rgba(34, 197, 94, ${Math.min(Math.abs(token.shap_score) / maxScore + 0.2, 1)})`,
              }}
              title={`SHAP: ${token.shap_score.toFixed(6)}`}
            >
              {token.token}
              <span className="ml-1 opacity-60 text-[10px] dark:opacity-80">
                {token.shap_score > 0 ? '+' : ''}{token.shap_score.toFixed(4)}
              </span>
            </motion.span>
          );
        })}
      </div>
    </Card>
  );
}
