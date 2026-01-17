// ==============================
// app.js - Stable Diffusion GUI
// ==============================

const EDGE_URL = "EDGE_URL_PLACEHOLDER"; // Inject dynamically via server
const resultsDiv = document.getElementById("results");
const payloadListDiv = document.getElementById("payloadList");
const promptInput = document.getElementById("prompt");
const numImagesInput = document.getElementById("numImages");
const statusSpan = document.getElementById("status");

// ------------------
// LoRA / checkpoint mapping with improved keywords and example prompts
// ------------------
const modelMapping = [
  {
    keywords: ["furry", "anthro","anthropomorphic", "fluffy","animal","tail", "fur"],
    checkpoint: "ultranovaFurytoonmix_v10.safetensors",
    loras: [],
    example: "Furry rabbit, character, anthropomorphic, cute, fluffy tail, detailed fur, high quality, digital art"
  },
  {
    keywords: ["anime", "illustration", "manga", "cartoon", "ghibli"],
    checkpoint: "dreamshaper_8.safetensors",
    loras: [
      { file: "animeoutlineV4_16.safetensors", weight: 0.6 },
      { file: "ghibli_style_offset.safetensors", weight: 0.5 }
    ],
    example: "Anime-style character, colorful, clean lines, dynamic pose, highly detailed"
  },
  {
    keywords: ["photo", "portrait", "photo-realistic", "v60b1", "nsfw", "casual"],
    checkpoint: "cyberrealistic_v90.safetensors",
    loras: [
      { file: "add_detail.safetensors", weight: 0.5 },
      { file: "nudify_xl_lite.safetensors", weight: 1.0 },
	  {file : "FDMakeUp.safetensors", weight: 1.0}
    ],
    example: "Photorealistic human portrait, cinematic lighting, highly detailed, ultra-realistic"
  },
  {
    keywords: ["epic", "fantasy", "epicrealism", "xl"],
    checkpoint: "epicrealismXL_pureFix.safetensors",
    loras: [],
    example: "Epic fantasy scene, heroic character, highly detailed, cinematic lighting"
  },
  {
    keywords: ["human", "default", "neutral", "portrait"],
    checkpoint: "lyriel_v16.safetensors",
    loras: [],
    example: "Neutral human portrait, realistic proportions, soft lighting, high detail"
  },
  {
    keywords: ["animated", "cartoon", "revAnimated"],
    checkpoint: "revAnimated_v2Rebirth.safetensors",
    loras: [],
    example: "Cartoon character, bold lines, vibrant colors, expressive pose"
  },
  {
    keywords: ["xxmix", "hyperreal", "photorealistic"],
    checkpoint: "xxmix9realistic_v40.safetensors",
    loras: [],
    example: "Hyperrealistic human portrait, cinematic lighting, extremely detailed textures"
  },
  {
    keywords: ["toon", "furrytoon", "cartoonish"],
    checkpoint: "furrytoonmix_xlIllustriousV2.safetensors",
    loras: [],
    example: "Furry cartoon character, exaggerated features, vibrant colors, fun pose"
  }
];

// ------------------
// Select model and LoRAs based on prompt
// ------------------
function selectModelAndLoras(prompt) {
  const lower = prompt.toLowerCase();
  let checkpoint = "lyriel_v16.safetensors";
  let loras = [];
  for (const mapping of modelMapping) {
    if (mapping.keywords.some(k => lower.includes(k))) {
      checkpoint = mapping.checkpoint;
      loras = mapping.loras.map(l => ({ ...l }));
      break;
    }
  }
  return { checkpoint, loras };
}

// ------------------
// Format LoRAs for API
// ------------------
function formatLorasForAPI(loras) {
  const r = {};
  loras.forEach(l => {
    const key = l.file.replace(/\.[^/.]+$/, "");
    r[key] = { weight: l.weight };
  });
  return r;
}

// ------------------
// Update LoRA sidebar
// ------------------
function updatePayloadSidebar(loras) {
  payloadListDiv.innerHTML = "";
  loras.forEach((l, i) => {
    const div = document.createElement("div");
    const label = document.createElement("span"); 
    label.textContent = l.file;
    const input = document.createElement("input");
    input.type = "number"; input.min = 0; input.max = 1; input.step = 0.05; input.value = l.weight;
    input.onchange = e => l.weight = parseFloat(e.target.value);
    div.appendChild(label);
    div.appendChild(input);
    payloadListDiv.appendChild(div);
  });
}

// ------------------
// Generate single image
// ------------------
async function generateImage(prompt, replaceIndex = null, lorasOverride = null, seed = null) {
  const { checkpoint, loras } = selectModelAndLoras(prompt);
  const payloadLoras = lorasOverride || loras;

  const spinner = document.createElement("div"); 
  spinner.className = "spinner";

  let imgBox;
  if (replaceIndex !== null && resultsDiv.children[replaceIndex]) {
    imgBox = resultsDiv.children[replaceIndex];
    imgBox.innerHTML = "";
    imgBox.appendChild(spinner);
  } else {
    imgBox = document.createElement("div");
    imgBox.className = "image-box";
    imgBox.appendChild(spinner);
    resultsDiv.appendChild(imgBox);
  }

  const body = {
    prompt,
    override_settings: { sd_model_checkpoint: checkpoint },
    alwayson_scripts: { LoRA: formatLorasForAPI(payloadLoras) }
  };
  if (seed) body.seed = seed;

  try {
    const res = await fetch(EDGE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    imgBox.innerHTML = "";
    if (data.error) { imgBox.textContent = "Error: " + data.error; return; }

    const img = document.createElement("img");
    img.src = "data:image/png;base64," + data.images[0];
    img.alt = prompt;

    // Seed button
    const btnContainer = document.createElement("div");
    btnContainer.className = "btn-container";

    const seedBtn = document.createElement("button");
    seedBtn.textContent = "Generate Seeds";
    seedBtn.onclick = () => {
      const seedValue = seed || Math.floor(Math.random() * 1000000);
      const newTab = window.open("", "_blank");
      newTab.document.write("<style>body{background:#121212;color:#e0e0e0;font-family:sans-serif;padding:1rem;} img{width:150px;height:150px;margin:0.2rem;border:1px solid #444;} button{background:#3a86ff;color:white;border:none;border-radius:4px;padding:0.3rem;margin:0.2rem;cursor:pointer;} button:hover{background:#1f6ae0;}</style>");
      newTab.document.write("<h2>Seed Variations</h2><div id='seedResults' style='display:flex;flex-wrap:wrap;'></div><button id='regenerate5'>Regenerate 5</button>");
      const seedResultsDiv = newTab.document.getElementById("seedResults");

      async function gen5Seeds() {
        seedResultsDiv.innerHTML = "";
        for (let i = 0; i < 5; i++) {
          const seed_i = seedValue + i;
          const body = { prompt, override_settings: { sd_model_checkpoint: checkpoint }, alwayson_scripts: { LoRA: formatLorasForAPI(payloadLoras) }, seed: seed_i };
          const res = await fetch(EDGE_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
          const data = await res.json();
          const img = newTab.document.createElement("img");
          img.src = "data:image/png;base64," + data.images[0];
          seedResultsDiv.appendChild(img);
        }
      }

      newTab.document.getElementById("regenerate5").onclick = gen5Seeds;
      gen5Seeds();
    };

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.onclick = () => imgBox.remove();

    btnContainer.append(seedBtn, deleteBtn);
    imgBox.append(img, btnContainer);

  } catch (err) {
    imgBox.innerHTML = "Error: " + err.message;
  }
}

// ------------------
// Generate Button
// ------------------
document.getElementById("generateBtn").onclick = async () => {
  const prompt = promptInput.value.trim();
  const numImages = parseInt(numImagesInput.value) || 1;
  if (!prompt) { alert("Enter a prompt!"); return; }
  statusSpan.textContent = `Generating ${numImages} image${numImages>1?'s':''}...`;
  const { loras } = selectModelAndLoras(prompt);
  updatePayloadSidebar(loras);
  for (let i = 0; i < numImages; i++) { await generateImage(prompt, i, loras); }
  while (resultsDiv.children.length > numImages) { resultsDiv.lastChild.remove(); }
  statusSpan.textContent = "";
};

// ------------------
// Regenerate Payload Button
// ------------------
document.getElementById("regeneratePayload").onclick = () => {
  const prompt = promptInput.value.trim();
  if (!prompt) return;
  const loras = selectModelAndLoras(prompt).loras;
  loras.forEach((l, i) => l.weight = parseFloat(payloadListDiv.children[i].querySelector("input").value));
  resultsDiv.childNodes.forEach((imgBox, i) => generateImage(prompt, i, loras));
};

// ------------------
// Ref Table Button (Mobile-Friendly + Copy Prompt)
// ------------------
document.getElementById("refTableBtn").onclick = () => {
  const newWin = window.open("", "_blank");
  newWin.document.write("<meta name='viewport' content='width=device-width, initial-scale=1.0'>");
  newWin.document.write("<style>body{background:#121212;color:#e0e0e0;font-family:sans-serif;padding:1rem;} table{width:100%;border-collapse:collapse;} th,td{border:1px solid #444;padding:0.5rem;text-align:left;} th{background:#1f1f1f;} tr:nth-child(even){background:#1a1a1a;} button{background:#3a86ff;color:white;border:none;border-radius:4px;padding:0.3rem;margin:0.2rem;cursor:pointer;} button:hover{background:#1f6ae0;} </style>");
  newWin.document.write("<h2>LoRA / Checkpoint Reference Table</h2>");
  newWin.document.write("<table><thead><tr><th>Art Style Keywords</th><th>Checkpoint / LoRAs</th><th>Example Prompt</th><th>Action</th></tr></thead><tbody>");

  modelMapping.forEach((m, index) => {
    const keywords = m.keywords.join(", ");
    const loras = m.loras.length ? m.loras.map(l => `${l.file} (${l.weight})`).join(", ") : "None";
    const examplePrompt = m.example || `${m.keywords[0]} portrait, high quality, detailed`;
    newWin.document.write(
      `<tr>
        <td>${keywords}</td>
        <td>${m.checkpoint} / ${loras}</td>
        <td id="prompt${index}">${examplePrompt}</td>
        <td><button onclick="navigator.clipboard.writeText(document.getElementById('prompt${index}').innerText).then(()=>alert('Copied!'))">Copy Prompt</button></td>
      </tr>`
    );
  });

  newWin.document.write("</tbody></table>");
};
