import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

serve(async (req) => {
  try {
    const url = new URL(req.url);

    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    // Serve frontend files
    if (req.method === "GET") {
      const path = url.pathname === "/" ? "./index.html" : `.${url.pathname}`;
      try {
        const content = await Deno.readTextFile(path);
        let contentType = "text/html";
        if (path.endsWith(".js")) contentType = "application/javascript";
        if (path.endsWith(".css")) contentType = "text/css";

        // Inject edge URL for frontend
        let htmlContent = content;
        if (path.endsWith(".html")) {
          let edgeUrl = "http://127.0.0.1:8000"; // default
          try {
            edgeUrl = (await Deno.readTextFile("./edge_url.txt")).trim();
          } catch {}
          htmlContent = content.replace("EDGE_URL_PLACEHOLDER", edgeUrl);
        }

        return new Response(htmlContent, {
          headers: { "Content-Type": contentType, "Access-Control-Allow-Origin": "*" },
        });
      } catch {
        return new Response("File not found", { status: 404 });
      }
    }

    // Handle POST -> generate images
    if (req.method === "POST") {
      const bodyText = await req.text();
      if (!bodyText) return new Response(JSON.stringify({ error: "Empty request body" }), { status: 400, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });

      const { prompt, numImages = 1, steps = 30, width = 512, height = 512 } = JSON.parse(bodyText);

      const sdUrl = "http://127.0.0.1:7860";

      // Generate all images in parallel
      const requests = Array.from({ length: numImages }, () =>
        fetch(`${sdUrl}/sdapi/v1/txt2img`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, steps, width, height }),
        }).then((res) => res.json())
      );

      const imagesData = await Promise.all(requests);

      // Collect base64 images from each response
      const allImages: string[] = imagesData.map((d) => d.images[0]);

      return new Response(JSON.stringify({ images: allImages }), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    return new Response("Not found", { status: 404 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});
