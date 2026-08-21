import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { groq } from "@ai-sdk/groq";
import { buildChatSystemPrompt } from "@/lib/portfolio-knowledge";

export const maxDuration = 30;

const MAX_MESSAGES = 12;
const MAX_CHARS_PER_MESSAGE = 2000;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 20;

type RateBucket = { count: number; resetAt: number };

const rateBuckets = new Map<string, RateBucket>();

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip") || "unknown";
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(ip);
  if (!bucket || now >= bucket.resetAt) {
    rateBuckets.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  if (bucket.count >= RATE_LIMIT_MAX) return true;
  bucket.count += 1;
  return false;
}

function extractText(message: UIMessage): string {
  return message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

export async function POST(req: Request) {
  if (!process.env.GROQ_API_KEY) {
    return Response.json(
      { error: "Chat is not configured. Missing GROQ_API_KEY." },
      { status: 503 },
    );
  }

  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    return Response.json(
      { error: "Too many requests. Please try again in a few minutes." },
      { status: 429 },
    );
  }

  let body: { messages?: UIMessage[] };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const incoming = Array.isArray(body.messages) ? body.messages : [];
  if (incoming.length === 0) {
    return Response.json({ error: "No messages provided." }, { status: 400 });
  }

  const capped = incoming.slice(-MAX_MESSAGES).map((message) => {
    const text = extractText(message);
    if (text.length <= MAX_CHARS_PER_MESSAGE) return message;
    return {
      ...message,
      parts: [{ type: "text" as const, text: text.slice(0, MAX_CHARS_PER_MESSAGE) }],
    };
  });

  const result = streamText({
    model: groq("allam-2-7b"),
    system: buildChatSystemPrompt(),
    messages: await convertToModelMessages(capped),
  });

  return result.toUIMessageStreamResponse();
}
