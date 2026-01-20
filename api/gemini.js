export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY missing" });
    }

    const { prompt } = req.body || {};
    if (!prompt) {
      return res.status(400).json({ error: "Prompt missing" });
    }

    const url =
      "https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=" +
      apiKey;

    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    const data = await r.json();

    if (!r.ok) {
      return res.status(500).json({
        error: data?.error?.message || "Gemini error",
      });
    }

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "Cevap gelmedi.";

    return res.status(200).json({ ok: true, reply });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}
