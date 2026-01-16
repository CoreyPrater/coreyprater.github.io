import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import OpenAI from "openai";

serve(async (req) => {
  try {
    const { prompt, character } = await req.json();

    const openai = new OpenAI({
      apiKey: Deno.env.get("OPENAI_API_KEY")!
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: `You are ${character}. Stay in character.` },
        { role: "user", content: prompt }
      ]
    });

    return new Response(
      JSON.stringify({ text: completion.choices[0].message.content }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
});
