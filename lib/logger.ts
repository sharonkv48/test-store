type LogLevel = "info" | "warn" | "error";

function log(level: LogLevel, event: string, data: Record<string, unknown> = {}): void {
  console.log(
    JSON.stringify({
      level,
      event,
      ...data,
      timestamp: new Date().toISOString(),
      source: "resumebot",
    })
  );
}

export function logSessionStart(sessionId: string): void {
  log("info", "SESSION_START", { sessionId });
}

export function logUserMessage(sessionId: string, charCount: number): void {
  // Log character count, not the actual resume content (privacy)
  log("info", "USER_MESSAGE", { sessionId, charCount });
}

export function logAnalysisStarted(sessionId: string): void {
  log("info", "ANALYSIS_STARTED", { sessionId });
}

export function logAnalysisComplete(sessionId: string, responsePreview: string): void {
  log("info", "ANALYSIS_COMPLETE", {
    sessionId,
    preview: responsePreview.slice(0, 150),
  });
}

export function logUnhandledIntent(
  sessionId: string,
  userMessage: string,
  category: string
): void {
  // *** MOST IMPORTANT — the monitoring system keys on this event ***
  log("warn", "UNHANDLED_INTENT", {
    sessionId,
    userMessage: userMessage.trim().slice(0, 500),
    category,   // e.g. "pdf_upload", "file_export", "session_memory"
  });
}

export function logApiError(sessionId: string, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  log("error", "API_ERROR", { sessionId, error: message });
}
