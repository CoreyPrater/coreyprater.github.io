// Make sure this matches the latest Ngrok URL from edge_url.txt
const EDGE_URL = "http://localhost:8000"; // replace with Ngrok URL for iPhone access

const generateBtn = document.getElementById("generateBtn");
const promptInput = document.getElementById("prompt");
const resultsDiv = document.getElementById("results");

generateBtn.addEventListener("click", async () => {
  const prompt = promptInput.value.trim();
  if (!prompt) {
    alert("Please enter a prompt!");
    return;
  }

  resultsDiv.innerHTML = "Generating...";

  try {
    const res = await fetch(EDGE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt })
    });

    const data = await res.json();

    if (data.error) {
      resultsDiv.innerHTML = `<p style="color:red">${data.error}</p>`;
      return;
    }

    // Clear previous results
    resultsDiv.innerHTML = "";

    // Loop through returned images (base64) and display
    for (let imgBase64 of data.images) {
      const img = document.createElement("img");
      img.src = "data:image/png;base64," + imgBase64;
      img.style.maxWidth = "100%";
      img.style.marginBottom = "10px";
      resultsDiv.appendChild(img);
    }

  } catch (err) {
    resultsDiv.innerHTML = `<p style="color:red">Error: ${err.message}</p>`;
  }
});
