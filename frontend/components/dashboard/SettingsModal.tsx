"use client";

import { useState, useEffect } from "react";
import { Settings, Save, AlertCircle, Server, ExternalLink, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getApiUrl, setApiUrl, clearApiUrl } from "@/lib/settings";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUrlChange?: () => void;
}

export function SettingsModal({ open, onOpenChange, onUrlChange }: SettingsModalProps) {
  const [apiUrl, setApiUrlState] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const url = getApiUrl();
    if (url) {
      setApiUrlState(url);
    }
  }, [open]);

  const handleSave = () => {
    const trimmedUrl = apiUrl.trim();
    if (trimmedUrl) {
      setApiUrl(trimmedUrl);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      if (onUrlChange) onUrlChange();
    }
  };

  const handleClear = () => {
    setApiUrlState("");
    clearApiUrl();
    if (onUrlChange) onUrlChange();
  };

  const handleClose = () => {
    setSaved(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-lg">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Settings className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            Backend Configuration
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="space-y-3">
            <label className="text-sm font-medium flex items-center gap-2">
              <Server className="w-4 h-4" />
              FastAPI Server URL
            </label>
            <Input
              placeholder="https://xxxx.trycloudflare.com"
              value={apiUrl}
              onChange={(e) => setApiUrlState(e.target.value)}
              className="h-11"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Enter your Cloudflare tunnel URL from Google Colab
            </p>
            {!apiUrl && (
              <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                URL required for email analysis
              </p>
            )}
          </div>

          {!apiUrl && (
            <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    No Backend Configured
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                    Enter your Cloudflare tunnel URL to enable phishing analysis
                  </p>
                </div>
              </div>
            </div>
          )}

          {saved && (
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-800 dark:text-green-200">
                URL saved successfully!
              </span>
            </div>
          )}

          <div className="pt-2">
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                Setup Instructions
              </h4>
              <ol className="text-xs text-gray-600 dark:text-gray-400 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium flex-shrink-0">1</span>
                  <span>Run your FastAPI in Google Colab</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium flex-shrink-0">2</span>
                  <span>Start cloudflared tunnel in a cell</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium flex-shrink-0">3</span>
                  <span>Copy the generated HTTPS URL</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium flex-shrink-0">4</span>
                  <span>Paste it in the field above</span>
                </li>
              </ol>
            </div>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={handleClear} className="gap-2">
            <X className="w-4 h-4" />
            Clear
          </Button>
          <Button onClick={handleSave} className="gap-2" disabled={!apiUrl.trim()}>
            <Save className="w-4 h-4" />
            Save URL
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
