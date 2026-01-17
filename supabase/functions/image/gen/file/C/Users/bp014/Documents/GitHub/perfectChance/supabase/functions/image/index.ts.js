import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
serve(async (req)=>{
  try {
    const url = new URL(req.url);
    // -----------------------------
    // Handle CORS preflight
    // -----------------------------
    if (req.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }
    // -----------------------------
    // Determine EDGE_URL for frontend
    // -----------------------------
    let edgeUrl = "http://127.0.0.1:8000"; // default local
    try {
      const ngrokUrl = (await Deno.readTextFile("./edge_url.txt")).trim();
      // If request is from external host (not localhost), use Ngrok
      const host = req.headers.get("host") ?? "";
      if (!host.includes("127.0.0.1") && !host.includes("localhost")) {
        edgeUrl = ngrokUrl;
      }
    } catch (_) {
      console.warn("edge_url.txt not found; using localhost for EDGE_URL");
    }
    // -----------------------------
    // Serve JS and CSS files
    // -----------------------------
    if (req.method === "GET" && (url.pathname.endsWith(".js") || url.pathname.endsWith(".css"))) {
      const filePath = `.${url.pathname}`;
      let contentType = "text/plain";
      if (url.pathname.endsWith(".js")) contentType = "application/javascript";
      if (url.pathname.endsWith(".css")) contentType = "text/css";
      const data = await Deno.readTextFile(filePath);
      return new Response(data, {
        headers: {
          "Content-Type": contentType,
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
    // -----------------------------
    // Serve HTML with injected EDGE_URL
    // -----------------------------
    if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/index.html")) {
      let html = await Deno.readTextFile("./index.html");
      html = html.replace("EDGE_URL_PLACEHOLDER", edgeUrl);
      return new Response(html, {
        headers: {
          "Content-Type": "text/html",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
    // -----------------------------
    // POST -> forward to local SD WebUI
    // -----------------------------
    if (req.method === "POST") {
      const bodyText = await req.text();
      if (!bodyText) return new Response(JSON.stringify({
        error: "Empty request body"
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
      const { prompt } = JSON.parse(bodyText);
      const sdUrl = "http://127.0.0.1:7860";
      const res = await fetch(`${sdUrl}/sdapi/v1/txt2img`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          prompt,
          steps: 30,
          width: 512,
          height: 512
        })
      });
      const data = await res.json();
      return new Response(JSON.stringify(data), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
    return new Response("Not found", {
      status: 404,
      headers: {
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({
      error: err.message
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vQzovVXNlcnMvYnAwMTQvRG9jdW1lbnRzL0dpdEh1Yi9wZXJmZWN0Q2hhbmNlL3N1cGFiYXNlL2Z1bmN0aW9ucy9pbWFnZS9pbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBzZXJ2ZSB9IGZyb20gXCJodHRwczovL2Rlbm8ubGFuZC9zdGRAMC4xNzcuMC9odHRwL3NlcnZlci50c1wiO1xyXG5cclxuc2VydmUoYXN5bmMgKHJlcSkgPT4ge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCB1cmwgPSBuZXcgVVJMKHJlcS51cmwpO1xyXG5cclxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAvLyBIYW5kbGUgQ09SUyBwcmVmbGlnaHRcclxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICBpZiAocmVxLm1ldGhvZCA9PT0gXCJPUFRJT05TXCIpIHtcclxuICAgICAgcmV0dXJuIG5ldyBSZXNwb25zZShudWxsLCB7XHJcbiAgICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgICAgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW5cIjogXCIqXCIsXHJcbiAgICAgICAgICBcIkFjY2Vzcy1Db250cm9sLUFsbG93LU1ldGhvZHNcIjogXCJHRVQsIFBPU1QsIE9QVElPTlNcIixcclxuICAgICAgICAgIFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctSGVhZGVyc1wiOiBcIkNvbnRlbnQtVHlwZVwiLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAvLyBEZXRlcm1pbmUgRURHRV9VUkwgZm9yIGZyb250ZW5kXHJcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgbGV0IGVkZ2VVcmwgPSBcImh0dHA6Ly8xMjcuMC4wLjE6ODAwMFwiOyAvLyBkZWZhdWx0IGxvY2FsXHJcbiAgICB0cnkge1xyXG4gICAgICBjb25zdCBuZ3Jva1VybCA9IChhd2FpdCBEZW5vLnJlYWRUZXh0RmlsZShcIi4vZWRnZV91cmwudHh0XCIpKS50cmltKCk7XHJcbiAgICAgIC8vIElmIHJlcXVlc3QgaXMgZnJvbSBleHRlcm5hbCBob3N0IChub3QgbG9jYWxob3N0KSwgdXNlIE5ncm9rXHJcbiAgICAgIGNvbnN0IGhvc3QgPSByZXEuaGVhZGVycy5nZXQoXCJob3N0XCIpID8/IFwiXCI7XHJcbiAgICAgIGlmICghaG9zdC5pbmNsdWRlcyhcIjEyNy4wLjAuMVwiKSAmJiAhaG9zdC5pbmNsdWRlcyhcImxvY2FsaG9zdFwiKSkge1xyXG4gICAgICAgIGVkZ2VVcmwgPSBuZ3Jva1VybDtcclxuICAgICAgfVxyXG4gICAgfSBjYXRjaCAoXykge1xyXG4gICAgICBjb25zb2xlLndhcm4oXCJlZGdlX3VybC50eHQgbm90IGZvdW5kOyB1c2luZyBsb2NhbGhvc3QgZm9yIEVER0VfVVJMXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAvLyBTZXJ2ZSBKUyBhbmQgQ1NTIGZpbGVzXHJcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgaWYgKHJlcS5tZXRob2QgPT09IFwiR0VUXCIgJiYgKHVybC5wYXRobmFtZS5lbmRzV2l0aChcIi5qc1wiKSB8fCB1cmwucGF0aG5hbWUuZW5kc1dpdGgoXCIuY3NzXCIpKSkge1xyXG4gICAgICBjb25zdCBmaWxlUGF0aCA9IGAuJHt1cmwucGF0aG5hbWV9YDtcclxuICAgICAgbGV0IGNvbnRlbnRUeXBlID0gXCJ0ZXh0L3BsYWluXCI7XHJcbiAgICAgIGlmICh1cmwucGF0aG5hbWUuZW5kc1dpdGgoXCIuanNcIikpIGNvbnRlbnRUeXBlID0gXCJhcHBsaWNhdGlvbi9qYXZhc2NyaXB0XCI7XHJcbiAgICAgIGlmICh1cmwucGF0aG5hbWUuZW5kc1dpdGgoXCIuY3NzXCIpKSBjb250ZW50VHlwZSA9IFwidGV4dC9jc3NcIjtcclxuXHJcbiAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBEZW5vLnJlYWRUZXh0RmlsZShmaWxlUGF0aCk7XHJcbiAgICAgIHJldHVybiBuZXcgUmVzcG9uc2UoZGF0YSwgeyBoZWFkZXJzOiB7IFwiQ29udGVudC1UeXBlXCI6IGNvbnRlbnRUeXBlLCBcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiOiBcIipcIiB9IH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAvLyBTZXJ2ZSBIVE1MIHdpdGggaW5qZWN0ZWQgRURHRV9VUkxcclxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICBpZiAocmVxLm1ldGhvZCA9PT0gXCJHRVRcIiAmJiAodXJsLnBhdGhuYW1lID09PSBcIi9cIiB8fCB1cmwucGF0aG5hbWUgPT09IFwiL2luZGV4Lmh0bWxcIikpIHtcclxuICAgICAgbGV0IGh0bWwgPSBhd2FpdCBEZW5vLnJlYWRUZXh0RmlsZShcIi4vaW5kZXguaHRtbFwiKTtcclxuICAgICAgaHRtbCA9IGh0bWwucmVwbGFjZShcIkVER0VfVVJMX1BMQUNFSE9MREVSXCIsIGVkZ2VVcmwpO1xyXG4gICAgICByZXR1cm4gbmV3IFJlc3BvbnNlKGh0bWwsIHsgaGVhZGVyczogeyBcIkNvbnRlbnQtVHlwZVwiOiBcInRleHQvaHRtbFwiLCBcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiOiBcIipcIiB9IH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAvLyBQT1NUIC0+IGZvcndhcmQgdG8gbG9jYWwgU0QgV2ViVUlcclxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICBpZiAocmVxLm1ldGhvZCA9PT0gXCJQT1NUXCIpIHtcclxuICAgICAgY29uc3QgYm9keVRleHQgPSBhd2FpdCByZXEudGV4dCgpO1xyXG4gICAgICBpZiAoIWJvZHlUZXh0KSByZXR1cm4gbmV3IFJlc3BvbnNlKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6IFwiRW1wdHkgcmVxdWVzdCBib2R5XCIgfSksIHsgc3RhdHVzOiA0MDAsIGhlYWRlcnM6IHsgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIsIFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCI6IFwiKlwiIH0gfSk7XHJcblxyXG4gICAgICBjb25zdCB7IHByb21wdCB9ID0gSlNPTi5wYXJzZShib2R5VGV4dCk7XHJcblxyXG4gICAgICBjb25zdCBzZFVybCA9IFwiaHR0cDovLzEyNy4wLjAuMTo3ODYwXCI7XHJcblxyXG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChgJHtzZFVybH0vc2RhcGkvdjEvdHh0MmltZ2AsIHtcclxuICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxyXG4gICAgICAgIGhlYWRlcnM6IHsgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIgfSxcclxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IHByb21wdCwgc3RlcHM6IDMwLCB3aWR0aDogNTEyLCBoZWlnaHQ6IDUxMiB9KVxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXMuanNvbigpO1xyXG5cclxuICAgICAgcmV0dXJuIG5ldyBSZXNwb25zZShKU09OLnN0cmluZ2lmeShkYXRhKSwge1xyXG4gICAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAgIFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiLFxyXG4gICAgICAgICAgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW5cIjogXCIqXCIsXHJcbiAgICAgICAgfSxcclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIG5ldyBSZXNwb25zZShcIk5vdCBmb3VuZFwiLCB7IHN0YXR1czogNDA0LCBoZWFkZXJzOiB7IFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCI6IFwiKlwiIH0gfSk7XHJcblxyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgcmV0dXJuIG5ldyBSZXNwb25zZShKU09OLnN0cmluZ2lmeSh7IGVycm9yOiBlcnIubWVzc2FnZSB9KSwge1xyXG4gICAgICBzdGF0dXM6IDUwMCxcclxuICAgICAgaGVhZGVyczogeyBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIiwgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW5cIjogXCIqXCIgfSxcclxuICAgIH0pO1xyXG4gIH1cclxufSk7XHJcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxTQUFTLEtBQUssUUFBUSwrQ0FBK0M7QUFFckUsTUFBTSxPQUFPO0VBQ1gsSUFBSTtJQUNGLE1BQU0sTUFBTSxJQUFJLElBQUksSUFBSSxHQUFHO0lBRTNCLGdDQUFnQztJQUNoQyx3QkFBd0I7SUFDeEIsZ0NBQWdDO0lBQ2hDLElBQUksSUFBSSxNQUFNLEtBQUssV0FBVztNQUM1QixPQUFPLElBQUksU0FBUyxNQUFNO1FBQ3hCLFNBQVM7VUFDUCwrQkFBK0I7VUFDL0IsZ0NBQWdDO1VBQ2hDLGdDQUFnQztRQUNsQztNQUNGO0lBQ0Y7SUFFQSxnQ0FBZ0M7SUFDaEMsa0NBQWtDO0lBQ2xDLGdDQUFnQztJQUNoQyxJQUFJLFVBQVUseUJBQXlCLGdCQUFnQjtJQUN2RCxJQUFJO01BQ0YsTUFBTSxXQUFXLENBQUMsTUFBTSxLQUFLLFlBQVksQ0FBQyxpQkFBaUIsRUFBRSxJQUFJO01BQ2pFLDhEQUE4RDtNQUM5RCxNQUFNLE9BQU8sSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLFdBQVc7TUFDeEMsSUFBSSxDQUFDLEtBQUssUUFBUSxDQUFDLGdCQUFnQixDQUFDLEtBQUssUUFBUSxDQUFDLGNBQWM7UUFDOUQsVUFBVTtNQUNaO0lBQ0YsRUFBRSxPQUFPLEdBQUc7TUFDVixRQUFRLElBQUksQ0FBQztJQUNmO0lBRUEsZ0NBQWdDO0lBQ2hDLHlCQUF5QjtJQUN6QixnQ0FBZ0M7SUFDaEMsSUFBSSxJQUFJLE1BQU0sS0FBSyxTQUFTLENBQUMsSUFBSSxRQUFRLENBQUMsUUFBUSxDQUFDLFVBQVUsSUFBSSxRQUFRLENBQUMsUUFBUSxDQUFDLE9BQU8sR0FBRztNQUMzRixNQUFNLFdBQVcsQ0FBQyxDQUFDLEVBQUUsSUFBSSxRQUFRLEVBQUU7TUFDbkMsSUFBSSxjQUFjO01BQ2xCLElBQUksSUFBSSxRQUFRLENBQUMsUUFBUSxDQUFDLFFBQVEsY0FBYztNQUNoRCxJQUFJLElBQUksUUFBUSxDQUFDLFFBQVEsQ0FBQyxTQUFTLGNBQWM7TUFFakQsTUFBTSxPQUFPLE1BQU0sS0FBSyxZQUFZLENBQUM7TUFDckMsT0FBTyxJQUFJLFNBQVMsTUFBTTtRQUFFLFNBQVM7VUFBRSxnQkFBZ0I7VUFBYSwrQkFBK0I7UUFBSTtNQUFFO0lBQzNHO0lBRUEsZ0NBQWdDO0lBQ2hDLG9DQUFvQztJQUNwQyxnQ0FBZ0M7SUFDaEMsSUFBSSxJQUFJLE1BQU0sS0FBSyxTQUFTLENBQUMsSUFBSSxRQUFRLEtBQUssT0FBTyxJQUFJLFFBQVEsS0FBSyxhQUFhLEdBQUc7TUFDcEYsSUFBSSxPQUFPLE1BQU0sS0FBSyxZQUFZLENBQUM7TUFDbkMsT0FBTyxLQUFLLE9BQU8sQ0FBQyx3QkFBd0I7TUFDNUMsT0FBTyxJQUFJLFNBQVMsTUFBTTtRQUFFLFNBQVM7VUFBRSxnQkFBZ0I7VUFBYSwrQkFBK0I7UUFBSTtNQUFFO0lBQzNHO0lBRUEsZ0NBQWdDO0lBQ2hDLG9DQUFvQztJQUNwQyxnQ0FBZ0M7SUFDaEMsSUFBSSxJQUFJLE1BQU0sS0FBSyxRQUFRO01BQ3pCLE1BQU0sV0FBVyxNQUFNLElBQUksSUFBSTtNQUMvQixJQUFJLENBQUMsVUFBVSxPQUFPLElBQUksU0FBUyxLQUFLLFNBQVMsQ0FBQztRQUFFLE9BQU87TUFBcUIsSUFBSTtRQUFFLFFBQVE7UUFBSyxTQUFTO1VBQUUsZ0JBQWdCO1VBQW9CLCtCQUErQjtRQUFJO01BQUU7TUFFdkwsTUFBTSxFQUFFLE1BQU0sRUFBRSxHQUFHLEtBQUssS0FBSyxDQUFDO01BRTlCLE1BQU0sUUFBUTtNQUVkLE1BQU0sTUFBTSxNQUFNLE1BQU0sR0FBRyxNQUFNLGlCQUFpQixDQUFDLEVBQUU7UUFDbkQsUUFBUTtRQUNSLFNBQVM7VUFBRSxnQkFBZ0I7UUFBbUI7UUFDOUMsTUFBTSxLQUFLLFNBQVMsQ0FBQztVQUFFO1VBQVEsT0FBTztVQUFJLE9BQU87VUFBSyxRQUFRO1FBQUk7TUFDcEU7TUFFQSxNQUFNLE9BQU8sTUFBTSxJQUFJLElBQUk7TUFFM0IsT0FBTyxJQUFJLFNBQVMsS0FBSyxTQUFTLENBQUMsT0FBTztRQUN4QyxTQUFTO1VBQ1AsZ0JBQWdCO1VBQ2hCLCtCQUErQjtRQUNqQztNQUNGO0lBQ0Y7SUFFQSxPQUFPLElBQUksU0FBUyxhQUFhO01BQUUsUUFBUTtNQUFLLFNBQVM7UUFBRSwrQkFBK0I7TUFBSTtJQUFFO0VBRWxHLEVBQUUsT0FBTyxLQUFLO0lBQ1osT0FBTyxJQUFJLFNBQVMsS0FBSyxTQUFTLENBQUM7TUFBRSxPQUFPLElBQUksT0FBTztJQUFDLElBQUk7TUFDMUQsUUFBUTtNQUNSLFNBQVM7UUFBRSxnQkFBZ0I7UUFBb0IsK0JBQStCO01BQUk7SUFDcEY7RUFDRjtBQUNGIn0=
// denoCacheMetadata=14783655786706462729,3003493418402186101