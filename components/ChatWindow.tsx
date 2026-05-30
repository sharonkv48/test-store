"use client";

import React, { useState, useRef, useEffect } from "react";
import ChatMessage from "./ChatMessage";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatWindowProps {
  sessionId: string;
}

export default function ChatWindow({ sessionId }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let botContent = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                botContent += parsed.content;
                setMessages((prev) =>
                  prev.map((msg, idx) =>
                    idx === prev.length - 1 ? { ...msg, content: botContent } : msg
                  )
                );
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="relative flex h-[680px] flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-950/50 shadow-[0_30px_80px_rgba(2,8,23,0.55)] backdrop-blur-xl">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400" />

      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-100/60">
            Live analysis
          </p>
          <h2 className="mt-1 text-lg font-semibold text-white">
            ResumeBot chat
          </h2>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">
          <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_14px_rgba(110,231,183,0.9)]" />
          Ready
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 space-y-4 overflow-y-auto bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.08),transparent_46%)] px-4 py-5">
        {messages.length === 0 && (
          <div className="flex min-h-full items-center justify-center px-4 py-10 text-center">
            <div className="max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-inner shadow-cyan-950/10">
              <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-gradient-to-br from-cyan-400/20 to-indigo-400/20 ring-1 ring-white/10" />
              <p className="text-2xl font-semibold text-white">
                Hi! I&apos;m ResumeBot.
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Paste your resume text and I&apos;ll score the sections, point out
                the weak spots, and suggest cleaner wording.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs text-slate-300">
                <span className="rounded-full border border-white/10 bg-slate-950/40 px-3 py-1">
                  Section scores
                </span>
                <span className="rounded-full border border-white/10 bg-slate-950/40 px-3 py-1">
                  Clear rewrites
                </span>
                <span className="rounded-full border border-white/10 bg-slate-950/40 px-3 py-1">
                  Actionable feedback
                </span>
              </div>
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <ChatMessage key={index} message={message} />
        ))}

        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-2xl rounded-bl-md border border-white/10 bg-white/5 px-4 py-3 shadow-lg shadow-cyan-950/10">
              <div className="flex space-x-1.5">
                <div
                  className="h-2 w-2 animate-bounce rounded-full bg-cyan-300"
                  style={{ animationDelay: "0ms" }}
                />
                <div
                  className="h-2 w-2 animate-bounce rounded-full bg-cyan-300"
                  style={{ animationDelay: "150ms" }}
                />
                <div
                  className="h-2 w-2 animate-bounce rounded-full bg-cyan-300"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-white/10 bg-slate-950/50 p-4"
      >
        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-3 shadow-inner shadow-slate-950/40">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Paste your resume text here..."
            disabled={isLoading}
            rows={1}
            className="min-h-[56px] w-full resize-none bg-transparent px-1 py-1 text-white placeholder:text-slate-500 focus:outline-none disabled:opacity-50"
          />
          <div className="mt-3 flex flex-col gap-3 border-t border-white/5 pt-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-400">
              Press Enter to send, Shift+Enter for a new line.
            </p>
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-950/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Analyze
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
