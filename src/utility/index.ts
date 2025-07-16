// @ts-nocheck
import {createClient} from "@supabase/supabase-js";
import { createParser, type EventSourceParserEvent } from "eventsource-parser";

// Initialize Supabase client with environment variables
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export const OpenAIStream = async (prompt: string) => {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY ?? ""}`,
    },
    method: "POST",
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that accurately answers queries about the Quran.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 150,
      temperature: 0.0,
      stream: true,
    }),
  });

  if (res.status !== 200) {
    throw new Error("OpenAI API returned an error");
  }

  const stream = new ReadableStream({
    async start(controller) {
      const parser = createParser({
        onParse(event: EventSourceParserEvent) {
          if (event.type === "event" && event.data) {
            if (event.data === "[DONE]") {
              controller.close();
              return;
            }
            try {
              const json = JSON.parse(event.data);
              const text = json.choices[0].delta.content;
              const queue = encoder.encode(text);
              controller.enqueue(queue);
            } catch (e) {
              controller.error(e);
            }
          }
        }
      });

      const reader = res.body?.getReader();
      try {
        while (true) {
          const { done, value } = await reader!.read();
          if (done) {
            break;
          }
          parser.feed(decoder.decode(value));
        }
      } catch (e) {
        controller.error(e);
      }
    },
  });

  return stream;
};