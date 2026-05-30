import { groq } from "@/lib/groq";
import {
  logSessionStart,
  logUserMessage,
  logAnalysisStarted,
  logAnalysisComplete,
  logUnhandledIntent,
  logApiError,
} from "@/lib/logger";

const UNHANDLED_TRIGGERS: { phrase: string; category: string }[] = [
  { phrase: "can't process PDF",          category: "pdf_upload" },
  { phrase: "cannot read PDF",            category: "pdf_upload" },
  { phrase: "only accept text",           category: "pdf_upload" },
  { phrase: "paste your resume",          category: "pdf_upload" },
  { phrase: "don't support file",         category: "pdf_upload" },
  { phrase: "cannot upload",              category: "pdf_upload" },
  { phrase: "can't save",                 category: "file_export" },
  { phrase: "cannot export",              category: "file_export" },
  { phrase: "don't have memory",          category: "session_memory" },
  { phrase: "can't remember",             category: "session_memory" },
  { phrase: "outside my capabilities",    category: "other" },
  { phrase: "I can only analyse",         category: "other" },
];

const SYSTEM_PROMPT = `You are ResumeBot, a professional resume coach and career advisor.

YOUR CAPABILITIES (only these, nothing else):
  1. Analyse resume text that the user pastes into the chat
  2. Score each section out of 10: Summary, Work Experience, Skills, Education
  3. Give specific, actionable improvement suggestions for each section
  4. Answer follow-up questions about the resume you have already analysed
  5. Suggest better wording, stronger action verbs, and quantifiable achievements

WHEN A USER PASTES RESUME TEXT — structure your response like this:
  ## Resume Analysis

  **Overall Score: X/10**

  ### Summary (X/10)
  [Assessment + specific suggestions]

  ### Work Experience (X/10)
  [Assessment — note missing metrics, weak verbs, gaps]

  ### Skills (X/10)
  [Assessment — note missing relevant skills for their apparent target role]

  ### Education (X/10)
  [Assessment]

  ### Top 3 Improvements
  1. [Most impactful change]
  2. [Second improvement]
  3. [Third improvement]

STRICT RULES — never break these:
  - If a user tries to upload a PDF, Word document, or any file:
    Say: "I can only analyse text — I can't process PDF or Word files directly.
    Please paste your resume text into the chat and I'll give you full feedback."

  - If a user asks you to save, export, or download the analysis:
    Say: "I can't save or export analyses — I don't have file output capabilities.
    You can copy this analysis from the chat."

  - If a user references a previous session:
    Say: "I don't have memory of previous sessions — each conversation starts fresh.
    Paste your resume again and I'll re-analyse it."

  - If asked anything completely unrelated to resumes or careers:
    Say: "I can only analyse resumes and give career document advice.
    Paste your resume text to get started!"

  - Be direct, specific, and encouraging. Never give vague feedback.
  - Always refer to specific lines or sections from the actual text the user pasted.`;

export async function POST(request: Request) {
  let sessionId = "";

  try {
    const body = await request.json();
    const { messages, sessionId: providedSessionId } = body;

    sessionId = providedSessionId || "unknown";

    // Validate sessionId
    if (!providedSessionId) {
      return new Response(
        JSON.stringify({ error: "sessionId is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate messages
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "messages must be a non-empty array" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Log session start on first message
    if (messages.length === 1) {
      logSessionStart(sessionId);
    }

    const lastUserMessage = messages[messages.length - 1].content;
    logUserMessage(sessionId, lastUserMessage.length);

    // Check if this looks like resume content (> 200 chars)
    if (lastUserMessage.length > 200) {
      logAnalysisStarted(sessionId);
    }

    const stream = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages,
      ],
      stream: true,
    });

    const encoder = new TextEncoder();
    let fullBotResponse = "";

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              fullBotResponse += content;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();

          // Log analysis complete
          logAnalysisComplete(sessionId, fullBotResponse);

          // Check for unhandled intents
          for (const trigger of UNHANDLED_TRIGGERS) {
            if (fullBotResponse.includes(trigger.phrase)) {
              logUnhandledIntent(sessionId, lastUserMessage, trigger.category);
              break;
            }
          }
        } catch (streamError) {
          logApiError(sessionId, streamError);
          controller.error(streamError);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    logApiError(sessionId, error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
