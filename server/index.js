const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const express = require("express");
const cors = require("cors");
const { ethers } = require("ethers");
const { address, abi, issuers } = require("../frontend/src/contract.json");

const GEMINI_MODEL = "gemini-3.8-flash";
// If the first model is overloaded (503), try these in order.
const MODELS = [GEMINI_MODEL, "gemini-flash-latest", "gemini-2.5-flash", "gemini-3.1-flash-lite"];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
const contract = new ethers.Contract(address, abi, provider);
const app = express();
app.use(cors());

// 1) Deterministic rules decide the verdict. The LLM never does.
function runRules(rows) {
  const findings = [];
  const flagged = rows.filter((r) => r.flagged);
  const issuerCount = new Set(rows.map((r) => r.issuer)).size;
  let status = "Verified";

  for (const r of flagged) {
    const prior = Math.max(
      ...rows.filter((x) => x.index < r.index && !x.flagged).map((x) => x.km),
      0
    );
    findings.push(`Reading ${r.km} km by ${r.issuerName} is lower than earlier verified reading ${prior} km.`);
    status = "Suspicious";
  }
  if (status !== "Suspicious" && (rows.length < 3 || issuerCount < 3)) {
    findings.push(`Only ${rows.length} readings from ${issuerCount} issuer(s).`);
    status = "Partially Verified";
  }
  if (!findings.length) {
    findings.push(`${rows.length} readings from ${issuerCount} issuers rise consistently.`);
  }
  return { status, findings };
}

// 2) One LLM call to explain. Retries, tries backup models, and falls back to a
//    template so the demo never breaks.
async function explain(status, findings) {
  const fallback = `${status}. ${findings.join(" ")}`;
  if (!process.env.GEMINI_API_KEY) {
    return { text: fallback, source: "fallback", debug: "no GEMINI_API_KEY" };
  }

  const prompt =
    `You are writing a short note for a used-car buyer. ` +
    `Write exactly 3 plain sentences in your own words. Do not copy the findings word for word, ` +
    `and do not start with the verdict word.\n` +
    `Sentence 1: say that the odometer records for this vehicle do not add up, naming the main problem briefly.\n` +
    `Sentence 2: say what the buyer should do, which is to ask the seller to explain the gap.\n` +
    `Sentence 3: recommend an independent inspection before buying.\n` +
    `Do not say or imply fraud, tampering, or wrongdoing, and do not guess causes.\n` +
    `Verdict: ${status}. Findings: ${findings.join(" ")}`;

  const errors = [];
  for (const model of MODELS) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const r = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": process.env.GEMINI_API_KEY,
            },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
          }
        );
        const j = await r.json();
        const text = (j.candidates?.[0]?.content?.parts || [])
          .map((p) => p.text || "")
          .join("")
          .trim();
        if (text) return { text, source: "gemini", debug: model };
        errors.push(`${model}#${attempt}: HTTP ${r.status}`);
        if (![429, 500, 503].includes(r.status)) break; // not worth retrying this model
      } catch (e) {
        errors.push(`${model}#${attempt}: ${e.message}`);
      }
      await sleep(600);
    }
  }
  return { text: fallback, source: "fallback", debug: errors.join(" | ").slice(0, 300) };
}

app.get("/api/analyze/:vin", async (req, res) => {
  try {
    const vinHash = ethers.keccak256(ethers.toUtf8Bytes(req.params.vin));
    const raw = await contract.getTimeline(vinHash);
    const rows = raw.map((r, index) => ({
      index,
      km: Number(r.km),
      issuer: r.issuer,
      issuerName: issuers[r.issuer] ?? r.issuer,
      flagged: r.flagged,
      isCorrection: r.isCorrection,
    }));
    const { status, findings } = runRules(rows);
    const ex = await explain(status, findings);
    console.log("EXPLAIN:", ex.source, ex.debug);
    res.json({ status, findings, explanation: ex.text, source: ex.source, debug: ex.debug, rows });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.listen(3001, (err) => {
  if (err) {
    console.error("LISTEN FAILED:", err.message);
    process.exit(1);
  }
  console.log("Agent on http://localhost:3001");
  console.log("Gemini key loaded:", !!process.env.GEMINI_API_KEY, "| model:", GEMINI_MODEL);
});