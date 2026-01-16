import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "POST JSON only" }),
      { status: 405 }
    );
  }

  try {
    // Always call SD locally
    const baseUrl = "http://127.0.0.1:7860";

    const bodyText = await req.text();
    if (!bodyText) {
      return new Response(
        JSON.stringify({ error: "Empty request body" }),
        { status: 400 }
      );
    }

    const { prompt } = JSON.parse(bodyText);

    const res = await fetch(`${baseUrl}/sdapi/v1/txt2img`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        steps: 30,
        width: 512,
        height: 512
      })
    });

    const data = await res.json();

    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
