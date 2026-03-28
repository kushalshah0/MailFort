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
    const cleanedBody = email.body.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\*([^*]+)\*/g, '$1').replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
    const text = `${email.subject} ${cleanedBody}`;
    const baseUrl = apiUrl.replace(/\/$/, "");

    const payload = {
      text: text,
      model: model,
    };

    const response = await fetch(`${baseUrl}/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`FastAPI returned ${response.status}:`, errorText);
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
  } catch (error: any) {
    console.error("Error calling FastAPI:", error);
    let errorMessage = "Unable to analyze email.";
    
    if (error.message?.includes("fetch failed") || error.cause?.code === "ECONNREFUSED") {
      errorMessage = "Backend is offline. Please check your API URL in Settings.";
    } else if (error.message?.includes("NetworkError") || error.message?.includes("network")) {
      errorMessage = "Network error. Please check your internet connection.";
    } else if (error.message?.includes("timeout")) {
      errorMessage = "Request timed out. Please try again.";
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return {
      label: "legitimate",
      confidence: 0,
      severity: "low",
      phishing_type: null,
      top_tokens: [],
      error: errorMessage,
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
    const model = searchParams.get("model") || "bert";

    if (!apiUrl) {
      return NextResponse.json(
        { error: "API URL not configured. Please set it in Settings." },
        { status: 400 }
      );
    }

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Invalid request. Email required." },
        { status: 400 }
      );
    }

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

    return NextResponse.json({
      id: email.id,
      prediction,
    });
  } catch (error) {
    console.error("Error in /api/analyze POST:", error);
    return NextResponse.json(
      { error: "Failed to analyze email" },
      { status: 500 }
    );
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
