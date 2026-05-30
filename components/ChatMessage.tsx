"use client";

import React from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  // Simple markdown-like rendering for bot messages
  const renderContent = (content: string) => {
    if (isUser) return content;

    // Process bold, headers, and lists
    let rendered = content
      // Headers
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-4 mb-2 text-indigo-400">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-3 mb-1 text-white">$1</h3>')
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-indigo-300">$1</strong>')
      // Lists
      .replace(/^\d+\. (.*$)/gim, '<li class="ml-4 list-decimal">$1</li>')
      .replace(/^[-*] (.*$)/gim, '<li class="ml-4 list-disc">$1</li>')
      // Line breaks
      .replace(/\n/g, '<br/>');

    return <div dangerouslySetInnerHTML={{ __html: rendered }} />;
  };

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-3 ${
          isUser
            ? "bg-indigo-600 text-white"
            : "bg-gray-900 text-gray-100"
        }`}
      >
        {renderContent(message.content)}
      </div>
    </div>
  );
}
