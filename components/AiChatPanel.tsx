"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { buildSystemPrompt, parseLatexFromResponse } from "@/lib/aiHelpers";
import type { User } from "@supabase/supabase-js";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface SavedKey {
  id: string;
  provider: string;
  base_url: string | null;
}

interface AiChatPanelProps {
  latexSource: string;
  onLatexChange: (newLatex: string) => void;
  onClose: () => void;
  user: User | null;
}

const PROVIDERS = [
  { id: "openai", name: "OpenAI", placeholder: "sk-..." },
  { id: "anthropic", name: "Anthropic", placeholder: "sk-ant-..." },
  { id: "groq", name: "Groq", placeholder: "gsk_..." },
  { id: "openrouter", name: "OpenRouter", placeholder: "sk-or-..." },
];

export default function AiChatPanel({
  latexSource,
  onLatexChange,
  onClose,
  user,
}: AiChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [savedKeys, setSavedKeys] = useState<SavedKey[]>([]);
  const [activeProvider, setActiveProvider] = useState("openai");
  const [showSetup, setShowSetup] = useState(false);
  const [setupProvider, setSetupProvider] = useState("openai");
  const [setupKey, setSetupKey] = useState("");
  const [setupBaseUrl, setSetupBaseUrl] = useState("");
  const [setupSaving, setSetupSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Load saved keys on mount
  useEffect(() => {
    if (!user) return;
    fetch("/api/keys")
      .then((r) => r.json())
      .then((d) => {
        if (d.keys && d.keys.length > 0) {
          setSavedKeys(d.keys);
          setActiveProvider(d.keys[0].provider);
        } else {
          setShowSetup(true);
        }
      })
      .catch(() => {});
  }, [user]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, [showSetup]);

  const handleSaveKey = async () => {
    if (!setupKey.trim()) return;
    setSetupSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: setupProvider,
          apiKey: setupKey,
          baseUrl: setupBaseUrl || undefined,
        }),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error);
      }
      // Refresh keys
      const keysRes = await fetch("/api/keys");
      const keysData = await keysRes.json();
      setSavedKeys(keysData.keys || []);
      setActiveProvider(setupProvider);
      setShowSetup(false);
      setSetupKey("");
      setSetupBaseUrl("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save key");
    } finally {
      setSetupSaving(false);
    }
  };

  const handleDeleteKey = async (provider: string) => {
    try {
      await fetch("/api/keys", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      setSavedKeys((prev) => prev.filter((k) => k.provider !== provider));
      if (activeProvider === provider) {
        const remaining = savedKeys.filter((k) => k.provider !== provider);
        if (remaining.length > 0) {
          setActiveProvider(remaining[0].provider);
        } else {
          setShowSetup(true);
        }
      }
    } catch {}
  };

  const handleSend = useCallback(async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsStreaming(true);
    setError(null);

    const systemPrompt = buildSystemPrompt(latexSource);
    const apiMessages = [
      { role: "system", content: systemPrompt },
      ...newMessages,
    ];

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiMessages,
          provider: activeProvider,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Chat request failed");
      }

      // Stream the response
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let fullContent = "";
      let buffer = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") break;

          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              fullContent += delta;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: "assistant",
                  content: fullContent,
                };
                return updated;
              });
            }
          } catch {
            // skip
          }
        }
      }

      // Try to extract LaTeX from the complete response
      const extractedLatex = parseLatexFromResponse(fullContent);
      if (extractedLatex) {
        onLatexChange(extractedLatex);
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      const msg = err instanceof Error ? err.message : "Failed to get response";
      setError(msg);
      // Remove empty assistant message if error
      setMessages((prev) => {
        if (prev.length > 0 && prev[prev.length - 1].role === "assistant" && !prev[prev.length - 1].content) {
          return prev.slice(0, -1);
        }
        return prev;
      });
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [input, isStreaming, messages, latexSource, activeProvider, onLatexChange]);

  const handleStop = () => {
    abortRef.current?.abort();
    setIsStreaming(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Not signed in
  if (!user) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <svg className="h-10 w-10 text-zinc-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <p className="text-sm text-zinc-400">Sign in to use AI features</p>
        <p className="text-xs text-zinc-600">Your API keys are encrypted and stored securely</p>
      </div>
    );
  }

  // API key setup
  if (showSetup) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-zinc-700 px-3 py-2">
          <span className="text-xs font-semibold text-zinc-300">API Key Setup</span>
          {savedKeys.length > 0 && (
            <button onClick={() => setShowSetup(false)} className="text-xs text-zinc-500 hover:text-zinc-300">
              Cancel
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          <p className="text-xs text-zinc-400">
            Add your AI provider API key. It&apos;s encrypted and stored securely — never sent to our servers in plain text.
          </p>

          {/* Provider select */}
          <div>
            <label className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">Provider</label>
            <div className="mt-1 grid grid-cols-2 gap-1.5">
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSetupProvider(p.id)}
                  className={`rounded-md border px-2 py-1.5 text-xs transition-colors ${
                    setupProvider === p.id
                      ? "border-green-500 bg-green-500/10 text-green-400"
                      : "border-zinc-700 text-zinc-400 hover:border-zinc-500"
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* API key input */}
          <div>
            <label className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">API Key</label>
            <input
              type="password"
              value={setupKey}
              onChange={(e) => setSetupKey(e.target.value)}
              placeholder={PROVIDERS.find((p) => p.id === setupProvider)?.placeholder}
              className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-green-500 focus:outline-none"
            />
          </div>

          {/* Custom base URL */}
          <div>
            <label className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
              Custom Base URL <span className="text-zinc-600">(optional)</span>
            </label>
            <input
              type="url"
              value={setupBaseUrl}
              onChange={(e) => setSetupBaseUrl(e.target.value)}
              placeholder="https://api.openai.com/v1"
              className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-green-500 focus:outline-none"
            />
          </div>

          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}

          <button
            onClick={handleSaveKey}
            disabled={!setupKey.trim() || setupSaving}
            className="w-full rounded-md bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-500 disabled:opacity-50 transition-colors"
          >
            {setupSaving ? "Saving..." : "Save API Key"}
          </button>

          {/* Saved keys list */}
          {savedKeys.length > 0 && (
            <div className="pt-2 border-t border-zinc-800">
              <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 mb-2">Saved Keys</p>
              {savedKeys.map((k) => (
                <div key={k.id} className="flex items-center justify-between rounded-md bg-zinc-800/50 px-2 py-1.5 mb-1">
                  <span className="text-xs text-zinc-300">{PROVIDERS.find((p) => p.id === k.provider)?.name || k.provider}</span>
                  <button onClick={() => handleDeleteKey(k.provider)} className="text-xs text-zinc-500 hover:text-red-400">
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Main chat view
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-700 px-3 py-2">
        <div className="flex items-center gap-2">
          <svg className="h-3.5 w-3.5 text-green-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
          <span className="text-xs font-semibold text-zinc-300">AI Chat</span>
        </div>
        <div className="flex items-center gap-1">
          {/* Provider selector */}
          <select
            value={activeProvider}
            onChange={(e) => setActiveProvider(e.target.value)}
            className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400 focus:outline-none"
          >
            {savedKeys.map((k) => (
              <option key={k.provider} value={k.provider}>
                {PROVIDERS.find((p) => p.id === k.provider)?.name || k.provider}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowSetup(true)}
            title="Manage API keys"
            className="flex h-6 w-6 items-center justify-center rounded text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
          <button
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center rounded text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
            <svg className="h-8 w-8 text-zinc-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
            </svg>
            <p className="text-xs text-zinc-500">Ask AI to edit your resume</p>
            <p className="text-[10px] text-zinc-600">Try: &quot;Add a volunteer work section&quot;</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[90%] rounded-lg px-3 py-2 text-xs leading-relaxed ${
                msg.role === "user"
                  ? "bg-green-600/20 text-green-100"
                  : "bg-zinc-800 text-zinc-300"
              }`}
            >
              <pre className="whitespace-pre-wrap font-sans break-words">{msg.content}</pre>
              {msg.role === "assistant" && msg.content && parseLatexFromResponse(msg.content) && (
                <div className="mt-2 flex items-center gap-1.5 border-t border-zinc-700 pt-2">
                  <svg className="h-3 w-3 text-green-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                  <span className="text-[10px] text-green-400">LaTeX applied to editor</span>
                </div>
              )}
            </div>
          </div>
        ))}
        {isStreaming && messages.length > 0 && !messages[messages.length - 1].content && (
          <div className="flex justify-start">
            <div className="rounded-lg bg-zinc-800 px-3 py-2">
              <div className="flex gap-1">
                <div className="h-1.5 w-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="h-1.5 w-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="h-1.5 w-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="mx-3 mb-2 rounded-md border border-red-800 bg-red-900/20 px-3 py-1.5">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-zinc-700 p-3">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask AI to edit your resume..."
            rows={2}
            className="flex-1 resize-none rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-green-500 focus:outline-none"
            disabled={isStreaming}
          />
          {isStreaming ? (
            <button
              onClick={handleStop}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-red-600 text-white hover:bg-red-500 transition-colors self-end"
            >
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="1" />
              </svg>
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-green-600 text-white hover:bg-green-500 disabled:opacity-30 transition-colors self-end"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
