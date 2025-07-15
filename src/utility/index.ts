import {createClient} from "@supabase/supabase-js";
import { createParser, ParsedEvent, ReconnectInterval } from "eventsource-parser";

// Initialize Supabase client with environment variables
export const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const GroqStream = async (prompt: string) => {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.GROQ_API_KEY!}`
        },
        body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [{
                role: 'system',
                content: 'You are a highly knowledgeable AI with a deep understanding of the Quran. Your purpose is to provide respectful, considerate, and accurate responses to user questions about the Quran, its teachings, and Islamic beliefs. Use the text provided to form your answer, but avoid copying word-for-word from the surahs. Try to use your own words when possible. Always format your response with the answer first, then [SOURCES] as a separator, followed by the relevant verses, then [CONSENSUS] followed by the consensus analysis.'
            }, {
                role: 'user',
                content: `Question about Islam: ${prompt}

Please provide a detailed answer and include relevant verses from the Quran. Format your response in three distinct parts separated by [SOURCES] and [CONSENSUS]:

1. First part: Explain the answer without mentioning any specific verse numbers or references
[SOURCES]
2. Second part: List all relevant Quran verses with their chapter (surah) and verse (ayah) numbers that support your answer
[CONSENSUS]
3. Third part: Provide a consensus analysis in the following format:
- Direct Support: X% (percentage of verses that directly support the answer)
- Partial Support: Y% (percentage of verses that partially or indirectly support the answer)
- The remaining percentage represents verses that are contextual or less relevant`
            }],
            max_tokens: 500,
            temperature: 0.0,
            stream: true
        })
    });

    if(response.status !== 200) {
        throw new Error("Error");
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
        async start(controller) {
            const onParse = (event: ParsedEvent | ReconnectInterval) => {
                if(event.type === 'event') {
                    const data = event.data;

                    if (data === '[DONE]') {
                        controller.close();
                        return;
                    }

                    try {
                        const json = JSON.parse(data);
                        const text = json.choices[0].delta.content;
                        const queue = encoder.encode(text);
                        controller.enqueue(queue);
                    } catch (e) {
                        controller.error(e);
                    }
                }
            };

            const parser = createParser(onParse);
            for await (const chunk of response.body as any) {
                parser.feed(decoder.decode(chunk));
            }
        }
    });

    return stream;
};