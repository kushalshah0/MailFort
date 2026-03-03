import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../auth/[...nextauth]/route";
import { fetchEmails, Prediction, TokenScore } from "@/lib/gmail";

function calculateSeverity(confidence: number): "low" | "medium" | "high" {
  if (confidence >= 0.9) return "high";
  if (confidence >= 0.7) return "medium";
  return "low";
}

async function analyzeEmail(
  email: { message_id: string; subject: string; from: string; body: string },
  apiUrl: string,
  model: string
): Promise<Prediction> {
  try {
    const text = `${email.subject} ${email.body}`.trim();
    const baseUrl = apiUrl.replace(/\/$/, "");

    const response = await fetch(`${baseUrl}/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: text,
        model: model,
      }),
    });

    if (!response.ok) {
      throw new Error(`FastAPI returned ${response.status}`);
    }

    const result = await response.json();

    const label = result.prediction?.toLowerCase() === "phishing" ? "phishing" : "legitimate";
    const confidence = typeof result.confidence === "number" ? result.confidence : 0.5;
    
    let topTokens: TokenScore[] = [];
    if (result.top_tokens && Array.isArray(result.top_tokens)) {
      topTokens = result.top_tokens.map((t: any) => ({
        token: t.token,
        shap_score: t.shap_score,
      }));
    }

    return {
      label,
      confidence: Math.round(confidence * 10000) / 10000,
      severity: calculateSeverity(confidence),
      phishing_type: null,
      top_tokens: topTokens,
    };
  } catch (error) {
    console.error("Error calling FastAPI:", error);
    return {
      label: "legitimate",
      confidence: 0.5,
      severity: "low",
      phishing_type: null,
      top_tokens: [],
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
    const model = searchParams.get("model") || "bert";

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
          apiUrl,
          model
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
