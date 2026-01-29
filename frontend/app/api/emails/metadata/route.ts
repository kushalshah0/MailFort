import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/route";
import { fetchEmails } from "@/lib/gmail";

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
    const maxResults = parseInt(searchParams.get("maxResults") || "30");

    // Fetch emails from Gmail (metadata only, no BERT analysis)
    const emails = await fetchEmails(session.accessToken, maxResults);

    return NextResponse.json({ emails });
  } catch (error) {
    console.error("Error in /api/emails/metadata:", error);
    return NextResponse.json(
      { error: "Failed to fetch email metadata" },
      { status: 500 }
    );
  }
}
