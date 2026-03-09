import { google } from "googleapis";

export interface Email {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  snippet: string;
  date: string;
  labels: string[];
}

export interface TokenScore {
  token: string;
  shap_score: number;
}

export interface Prediction {
  label: "phishing" | "legitimate";
  confidence: number;
  severity: "low" | "medium" | "high";
  phishing_type: string | null;
  top_tokens?: TokenScore[];
  error?: string;
}

export interface EmailWithPrediction extends Email {
  prediction?: Prediction | null;
}

export async function getGmailClient(accessToken: string) {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });

  return google.gmail({ version: "v1", auth: oauth2Client });
}

export async function fetchEmails(
  accessToken: string,
  maxResults: number = 50
): Promise<Email[]> {
  try {
    const gmail = await getGmailClient(accessToken);

    // List messages from inbox
    const response = await gmail.users.messages.list({
      userId: "me",
      maxResults,
      labelIds: ["INBOX"],
    });

    const messages = response.data.messages || [];

    // Fetch full message details
    const emailPromises = messages.map(async (message) => {
      const msg = await gmail.users.messages.get({
        userId: "me",
        id: message.id!,
        format: "full",
      });

      return parseEmailMessage(msg.data);
    });

    const emails = await Promise.all(emailPromises);
    return emails.filter((email) => email !== null) as Email[];
  } catch (error: any) {
    console.error("Error fetching emails:", error);
    if (error.code === 401) {
      throw new Error("Authentication failed. Please sign in again.");
    }
    throw new Error("Failed to fetch emails from Gmail");
  }
}

function parseEmailMessage(message: any): Email | null {
  try {
    const headers = message.payload.headers;
    const getHeader = (name: string) =>
      headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())
        ?.value || "";

    const from = getHeader("From");
    const to = getHeader("To");
    const subject = getHeader("Subject");
    const date = getHeader("Date");

    // Extract body
    let body = "";
    if (message.payload.body.data) {
      body = Buffer.from(message.payload.body.data, "base64").toString("utf-8");
    } else if (message.payload.parts) {
      // Multi-part message
      const textPart = findTextPart(message.payload.parts);
      if (textPart && textPart.body.data) {
        body = Buffer.from(textPart.body.data, "base64").toString("utf-8");
      }
    }

    return {
      id: message.id,
      threadId: message.threadId,
      from,
      to,
      subject,
      body,
      snippet: message.snippet || "",
      date,
      labels: message.labelIds || [],
    };
  } catch (error) {
    console.error("Error parsing email message:", error);
    return null;
  }
}

function findTextPart(parts: any[]): any | null {
  for (const part of parts) {
    if (part.mimeType === "text/plain" || part.mimeType === "text/html") {
      return part;
    }
    if (part.parts) {
      const found = findTextPart(part.parts);
      if (found) return found;
    }
  }
  return null;
}
