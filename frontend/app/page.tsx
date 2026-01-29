"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Shield, Mail, Lock, Zap } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <div className="container mx-auto px-6 py-16">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl">
              <Shield className="w-12 h-12 text-white" />
            </div>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white">
            Welcome to <span className="text-blue-600">MailFort</span>
          </h1>

          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            AI-powered email phishing detection using advanced BERT technology.
            Protect your inbox from malicious threats with real-time analysis.
          </p>

          <div className="flex justify-center gap-4 pt-4">
            <Link href="/auth/signin">
              <Button size="lg" className="text-lg px-8 py-6">
                Get Started
                <Mail className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 mt-20 max-w-6xl mx-auto">
          <FeatureCard
            icon={<Shield className="w-8 h-8" />}
            title="BERT-Powered Detection"
            description="State-of-the-art machine learning model trained to detect sophisticated phishing attempts with high accuracy."
            color="from-blue-500 to-indigo-500"
          />
          <FeatureCard
            icon={<Lock className="w-8 h-8" />}
            title="Secure Gmail Integration"
            description="Your emails are analyzed server-side only. OAuth tokens never leave our secure infrastructure."
            color="from-purple-500 to-pink-500"
          />
          <FeatureCard
            icon={<Zap className="w-8 h-8" />}
            title="Real-Time Analysis"
            description="Instant phishing detection with confidence scores, severity levels, and risk indicators for every email."
            color="from-orange-500 to-red-500"
          />
        </div>
      </div>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

function FeatureCard({ icon, title, description, color }: FeatureCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1">
      <div className={`w-14 h-14 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center text-white mb-4`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-400">
        {description}
      </p>
    </div>
  );
}
