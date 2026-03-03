import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../auth/[...nextauth]/route";
import { fetchEmails } from "@/lib/gmail";

interface AnalyzeEmailResponse {
  label: "phishing" | "legitimate";
  confidence: number;
  severity: "low" | "medium" | "high";
  phishing_type: string | null;
}

function calculateSeverity(confidence: number): "low" | "medium" | "high" {
  if (confidence >= 0.9) return "high";
  if (confidence >= 0.7) return "medium";
  return "low";
}

async function analyzeEmail(
  email: { message_id: string; subject: string; from: string; body: string },
  apiUrl: string
): Promise<AnalyzeEmailResponse> {
  try {
    const text = `${email.subject} ${email.body}`.trim();

    const response = await fetch(`${apiUrl}/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: text,
        model: "phishing",
      }),
    });

    if (!response.ok) {
      throw new Error(`FastAPI returned ${response.status}`);
    }

    const result = await response.json();

    const label = result.prediction?.toLowerCase() === "phishing" ? "phishing" : "legitimate";
    const confidence = typeof result.confidence === "number" ? result.confidence : 0.5;

    return {
      label,
      confidence: Math.round(confidence * 10000) / 10000,
      severity: calculateSeverity(confidence),
      phishing_type: null,
    };
  } catch (error) {
    console.error("Error calling FastAPI:", error);
    return {
      label: "legitimate",
      confidence: 0.5,
      severity: "low",
      phishing_type: null,
    };
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.accessToken) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in again." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const maxResults = parseInt(searchParams.get("maxResults") || "50");
    const apiUrl = searchParams.get("apiUrl");

    if (!apiUrl) {
      return NextResponse.json(
        { error: "API URL not configured. Please set it in Settings." },
        { status: 400 }
      );
    }

    const emails = await fetchEmails(session.accessToken, maxResults);

    const analyzedEmails = await Promise.all(
      emails.map(async (email) => {
        const prediction = await analyzeEmail(
          {
            message_id: email.id,
            subject: email.subject,
            from: email.from,
            body: email.body,
          },
          apiUrl
        );

        return {
          ...email,
          prediction,
        };
      })
    );

    analyzedEmails.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });

    return NextResponse.json({ emails: analyzedEmails });
  } catch (error) {
    console.error("Error in /api/analyze:", error);
    return NextResponse.json(
      { error: "Failed to analyze emails" },
      { status: 500 }
    );
  }
}
