import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../auth/[...nextauth]/route";

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

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.accessToken) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in again." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const apiUrl = searchParams.get("apiUrl");

    if (!apiUrl) {
      return NextResponse.json(
        { error: "API URL not configured. Please set it in Settings." },
        { status: 400 }
      );
    }

    const { emails } = await request.json();

    if (!Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { error: "Invalid request. Emails array required." },
        { status: 400 }
      );
    }

    const analyzedEmails = await Promise.all(
      emails.map(async (email: any) => {
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
          id: email.id,
          prediction,
        };
      })
    );

    return NextResponse.json({ results: analyzedEmails });
  } catch (error) {
    console.error("Error in /api/analyze-batch:", error);
    return NextResponse.json(
      { error: "Failed to analyze emails" },
      { status: 500 }
    );
  }
}
