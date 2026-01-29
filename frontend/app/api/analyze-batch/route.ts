import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../auth/[...nextauth]/route";

const FASTAPI_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface AnalyzeEmailRequest {
  message_id: string;
  subject: string;
  from: string;
  body: string;
}

interface AnalyzeEmailResponse {
  label: "phishing" | "legitimate";
  confidence: number;
  severity: "low" | "medium" | "high";
  phishing_type: string | null;
}

async function analyzeEmail(email: AnalyzeEmailRequest): Promise<AnalyzeEmailResponse> {
  try {
    const response = await fetch(`${FASTAPI_URL}/analyze-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message_id: email.message_id,
        subject: email.subject,
        from_: email.from,
        body: email.body,
      }),
    });

    if (!response.ok) {
      throw new Error(`FastAPI returned ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error calling FastAPI:", error);
    // Return a default prediction if analysis fails
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

    const { emails } = await request.json();

    if (!Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { error: "Invalid request. Emails array required." },
        { status: 400 }
      );
    }

    // Analyze each email with BERT
    const analyzedEmails = await Promise.all(
      emails.map(async (email: any) => {
        const prediction = await analyzeEmail({
          message_id: email.id,
          subject: email.subject,
          from: email.from,
          body: email.body,
        });

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
