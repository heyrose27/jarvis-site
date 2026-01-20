export const config = { runtime: "edge" };

export default async function handler(req) {
  try {
    // SADECE POST
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { "Content-Type": "application/json" } }
      );
    }

    // KEY
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY missing" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // BODY
    const body = await req.json().catch(() => ({}));
    const prompt = body?.prompt;
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Prompt missing" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // ✅ DOĞRU ENDPOINT (v1)
    const url =
      "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=" +
      apiKey;

    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      }),
    });

    const raw = await r.text();

    // hata ise ham hatayı JSON olarak dön
    if (!r.ok) {
      let err;
      try { err = JSON.parse(raw); } catch { err = { error: raw }; }
      return new Response(
        JSON.stringify({ error: err?.error?.message || err?.error || `Gemini error (${r.status})` }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    let data;
    try { data = JSON.parse(raw); } catch { data = {}; }

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "Cevap gelmedi.";

    return new Response(
      JSON.stringify({ ok: true, reply }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: String(e) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
