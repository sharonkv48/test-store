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
    <main className="relative min-h-screen overflow-hidden px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute right-0 top-24 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-64 w-[42rem] -translate-x-1/2 rounded-full bg-sky-400/10 blur-3xl" />
      </div>

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-white/5 px-4 py-2 text-xs font-medium uppercase tracking-[0.3em] text-cyan-100/80 shadow-[0_0_40px_rgba(34,211,238,0.12)] backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.9)]" />
            Wave-guided resume analysis
          </div>

          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Ride the wave to a stronger resume
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
            Paste your resume and get calm, structured feedback with clear next
            steps, section scores, and sharper wording.
          </p>

          <div className="mt-6 flex items-center justify-center">
            <svg
              viewBox="0 0 260 36"
              className="h-8 w-48 text-cyan-200/60"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M2 18c14 0 14-14 28-14s14 28 28 28 14-28 28-28 14 28 28 28 14-28 28-28 14 28 28 28 14-28 28-28 14 28 28 28 14-28 28-28"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_30px_80px_rgba(2,8,23,0.45)] backdrop-blur-xl">
            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-cyan-100/60">
                  What you&apos;ll get
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  A smoother path from raw text to sharper bullets
                </h2>
              </div>

              <div className="grid gap-3">
                {[
                  {
                    title: "Section-by-section scoring",
                    text: "Summary, experience, skills, and education are scored so the weak spots stand out fast.",
                  },
                  {
                    title: "Actionable rewrites",
                    text: "Get clearer phrasing, stronger verbs, and more measurable achievements.",
                  },
                  {
                    title: "Resume-first guidance",
                    text: "The feedback stays focused on career docs and keeps the advice practical.",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 shadow-inner shadow-cyan-950/20"
                  >
                    <p className="text-sm font-semibold text-cyan-100">
                      {item.title}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-300">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/10 p-4">
                  <p className="text-2xl font-semibold text-white">4</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-cyan-100/70">
                    Sections scored
                  </p>
                </div>
                <div className="rounded-2xl border border-sky-300/15 bg-sky-300/10 p-4">
                  <p className="text-2xl font-semibold text-white">3</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-sky-100/70">
                    Key improvements
                  </p>
                </div>
              </div>
            </div>
          </section>

          {sessionId && <ChatWindow sessionId={sessionId} />}
        </div>
      </div>
    </main>
  );
}
