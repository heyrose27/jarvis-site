export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { prompt } = req.body || {};
    if (!prompt) return res.status(400).json({ error: "prompt missing" });

    const key = process.env.GEMINI_API_KEY;
    if (!key) return res.status(500).json({ error: "GEMINI_API_KEY eksik" });

    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + key;

    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const data = await r.json();
    if (!r.ok) return res.status(500).json({ error: data?.error?.message || "Gemini error" });

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return res.status(200).json({ text });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}

