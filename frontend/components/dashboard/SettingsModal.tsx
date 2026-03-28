"use client";

import { useState, useEffect } from "react";
import { Settings, Save, AlertCircle, Server, ExternalLink, CheckCircle2, X, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getApiUrl, setApiUrl, clearApiSettings, getApiModel, setApiModel, getAnalysisMode, setAnalysisMode, AnalysisMode, ModelType } from "@/lib/settings";
import { Layers } from "lucide-react";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUrlChange?: () => void;
}

const MODELS: { value: ModelType; label: string }[] = [
  { value: "bert", label: "BERT" },
  { value: "lstm", label: "LSTM" },
  { value: "gru", label: "GRU" },
];

const ANALYSIS_MODES: { value: AnalysisMode; label: string; description: string }[] = [
  { value: "single", label: "Single", description: "Analyze when email is selected" },
  { value: "batch", label: "Batch", description: "Analyze all displayed emails" },
];

export function SettingsModal({ open, onOpenChange, onUrlChange }: SettingsModalProps) {
  const [apiUrl, setApiUrlState] = useState("");
  const [apiModel, setApiModelState] = useState<ModelType>("bert");
  const [analysisMode, setAnalysisModeState] = useState<AnalysisMode>("single");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const url = getApiUrl();
    const model = getApiModel();
    const mode = getAnalysisMode();
    if (url) setApiUrlState(url);
    setApiModelState(model);
    setAnalysisModeState(mode);
  }, [open]);

  const handleSave = () => {
    const trimmedUrl = apiUrl.trim().replace(/\/$/, "");
    if (trimmedUrl) {
      setApiUrl(trimmedUrl);
      setApiModel(apiModel);
      setAnalysisMode(analysisMode);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      if (onUrlChange) onUrlChange();
      onOpenChange(false);
    }
  };

  const handleClear = () => {
    setApiUrlState("");
    setApiModelState("bert");
    setAnalysisModeState("single");
    clearApiSettings();
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

          <div className="space-y-3">
            <label className="text-sm font-medium flex items-center gap-2">
              <Cpu className="w-4 h-4" />
              ML Model
            </label>
            <div className="grid grid-cols-3 gap-2">
              {MODELS.map((model) => (
                <button
                  key={model.value}
                  type="button"
                  onClick={() => setApiModelState(model.value)}
                  className={`h-11 px-4 py-2 text-sm font-medium rounded-lg border transition-all ${
                    apiModel === model.value
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-background text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  {model.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Select the ML model for phishing detection
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Analysis Mode
            </label>
            <div className="flex gap-4">
              {ANALYSIS_MODES.map((mode) => (
                <label
                  key={mode.value}
                  className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                    analysisMode === mode.value
                      ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  <input
                    type="radio"
                    name="analysisMode"
                    value={mode.value}
                    checked={analysisMode === mode.value}
                    onChange={() => setAnalysisModeState(mode.value)}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    analysisMode === mode.value
                      ? "border-blue-600"
                      : "border-gray-400 dark:border-gray-500"
                  }`}>
                    {analysisMode === mode.value && (
                      <div className="w-2 h-2 rounded-full bg-blue-600" />
                    )}
                  </div>
                  <span className={`text-sm font-medium ${
                    analysisMode === mode.value
                      ? "text-blue-700 dark:text-blue-300"
                      : "text-gray-700 dark:text-gray-300"
                  }`}>
                    {mode.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {saved && (
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-800 dark:text-green-200">
                Settings saved successfully!
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
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium flex-shrink-0">1</span>
                  <span>Choose notebook and run all cells: </span>
                  <a 
                    href="https://colab.research.google.com/github/kushalshah0/Detecting-AI-Generated-Phishing-Emails-Using-BERT/blob/main/ai_generated_phishing_email_detection_FastAPI.ipynb" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-blue-600 dark:text-blue-400 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    v1
                  </a>
                  <a 
                    href="https://colab.research.google.com/github/kushalshah0/Detecting-AI-Generated-Phishing-Emails-Using-BERT/blob/main/ai_generated_phishing_email_detection_FastAPI_v2.ipynb" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-blue-600 dark:text-blue-400 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    v2
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium flex-shrink-0">2</span>
                  <span>Copy the generated tunnel HTTPS URL</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium flex-shrink-0">3</span>
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
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
