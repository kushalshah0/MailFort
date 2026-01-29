import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../auth/[...nextauth]/route";
import { fetchEmails } from "@/lib/gmail";

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

    // Fetch emails from Gmail
    const emails = await fetchEmails(session.accessToken, maxResults);

    // Analyze each email with BERT
    const analyzedEmails = await Promise.all(
      emails.map(async (email) => {
        const prediction = await analyzeEmail({
          message_id: email.id,
          subject: email.subject,
          from: email.from,
          body: email.body,
        });

        return {
          ...email,
          prediction,
        };
      })
    );

    // Sort by date (newest first)
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
