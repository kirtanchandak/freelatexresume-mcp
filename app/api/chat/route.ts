import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { decrypt } from "@/lib/crypto";

const PROVIDER_DEFAULTS: Record<string, { baseUrl: string; model: string }> = {
  openai: { baseUrl: "https://api.openai.com/v1", model: "gpt-4o" },
  anthropic: { baseUrl: "https://api.anthropic.com/v1", model: "claude-sonnet-4-20250514" },
  groq: { baseUrl: "https://api.groq.com/openai/v1", model: "llama-3.3-70b-versatile" },
  openrouter: { baseUrl: "https://openrouter.ai/api/v1", model: "openai/gpt-4o" },
};

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { messages, provider = "openai" } = await req.json();

  if (!messages || !Array.isArray(messages)) {
    return new Response(JSON.stringify({ error: "messages array is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Get the user's API key for this provider
  const { data: keyRow, error: keyError } = await supabase
    .from("api_keys")
    .select("encrypted_key, base_url")
    .eq("user_id", user.id)
    .eq("provider", provider)
    .single();

  if (keyError || !keyRow) {
    return new Response(
      JSON.stringify({ error: `No API key found for provider "${provider}". Add one in settings.` }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  let apiKey: string;
  try {
    apiKey = await decrypt(keyRow.encrypted_key);
  } catch {
    return new Response(
      JSON.stringify({ error: "Failed to decrypt API key. Try re-saving it." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const defaults = PROVIDER_DEFAULTS[provider] || PROVIDER_DEFAULTS.openai;
  const baseUrl = keyRow.base_url || defaults.baseUrl;

  // Handle Anthropic separately (different API format)
  if (provider === "anthropic") {
    return handleAnthropicStream(apiKey, baseUrl, messages, defaults.model);
  }

  // OpenAI-compatible streaming
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: defaults.model,
      messages,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return new Response(
      JSON.stringify({ error: `Provider error: ${response.status} - ${errorText}` }),
      { status: response.status, headers: { "Content-Type": "application/json" } }
    );
  }

  // Forward the SSE stream
  return new Response(response.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

async function handleAnthropicStream(
  apiKey: string,
  baseUrl: string,
  messages: Array<{ role: string; content: string }>,
  model: string
) {
  // Extract system message
  const systemMsg = messages.find((m: { role: string }) => m.role === "system");
  const nonSystemMessages = messages.filter((m: { role: string }) => m.role !== "system");

  const response = await fetch(`${baseUrl}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 8192,
      system: systemMsg?.content || "",
      messages: nonSystemMessages,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return new Response(
      JSON.stringify({ error: `Anthropic error: ${response.status} - ${errorText}` }),
      { status: response.status, headers: { "Content-Type": "application/json" } }
    );
  }

  // Transform Anthropic SSE format to OpenAI-compatible format
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const transformStream = new TransformStream({
    transform(chunk, controller) {
      const text = decoder.decode(chunk, { stream: true });
      const lines = text.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") {
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            return;
          }
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === "content_block_delta" && parsed.delta?.text) {
              // Convert to OpenAI SSE format
              const openaiChunk = {
                choices: [{ delta: { content: parsed.delta.text } }],
              };
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(openaiChunk)}\n\n`)
              );
            } else if (parsed.type === "message_stop") {
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            }
          } catch {
            // Skip unparseable lines
          }
        }
      }
    },
  });

  return new Response(response.body!.pipeThrough(transformStream), {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
