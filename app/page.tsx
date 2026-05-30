"use client";

import { useEffect, useState } from "react";
import ChatWindow from "@/components/ChatWindow";

export default function Home() {
  const [sessionId, setSessionId] = useState<string>("");

  useEffect(() => {
    // Get or create session ID from localStorage
    let storedId = localStorage.getItem("resumebot_session_id");
    if (!storedId) {
      storedId = crypto.randomUUID();
      localStorage.setItem("resumebot_session_id", storedId);
    }
    setSessionId(storedId);
  }, []);

  return (
    <main className="min-h-screen bg-[#0a0a0a] py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">AI Resume Analyser</h1>
          <p className="text-gray-400 text-lg">Paste your resume. Get expert feedback in seconds.</p>
        </header>
        
        {sessionId && <ChatWindow sessionId={sessionId} />}
      </div>
    </main>
  );
}
