// Basit bir bellek içi (in-memory) IP takipçisi
const ipCache = new Map();

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // 1. IP KONTROLÜ (GÜVENLİK)
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const now = Date.now();
  const windowMs = 24 * 60 * 60 * 1000; // 24 saatlik pencere
  
  if (!ipCache.has(clientIp)) {
    ipCache.set(clientIp, { count: 1, firstRequest: now });
  } else {
    const userData = ipCache.get(clientIp);
    // 24 saat geçtiyse sayacı sıfırla
    if (now - userData.firstRequest > windowMs) {
      ipCache.set(clientIp, { count: 1, firstRequest: now });
    } else {
      // GÜNLÜK LİMİT: Her IP günde en fazla 10 istek atabilir
      if (userData.count >= 10) {
        return res.status(429).json({ error: "Günlük limitiniz doldu (IP: " + clientIp + ")" });
      }
      userData.count += 1;
    }
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Sistem hatası: API anahtarı eksik." });
    }

    const { prompt } = req.body || {};
    if (!prompt) {
      return res.status(400).json({ error: "İçerik boş olamaz." });
    }

    // 2. SERT KARAKTER SINIRI (GÜVENLİK & MALİYET)
    // Kullanıcıdan gelen prompt'un sonuna sistem kuralını backend'de zorla ekliyoruz
    const securePrompt = `${prompt}\n\n[SİSTEM KURALI: Cevap KESİNLİKLE 100 karakteri geçemez. Sadece sonucu yaz.]`;

    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: securePrompt }] }],
        // AI'nın uzun cevap vermesini teknik olarak da kısıtlıyoruz
        generationConfig: {
          maxOutputTokens: 50, // Yaklaşık 150-200 karakterlik teknik sınır
          temperature: 0.7
        }
      }),
    });

    const data = await r.json();
    if (!r.ok) {
      return res.status(500).json({
        error: data?.error?.message || "Gemini hatası",
      });
    }

    let reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Cevap gelmedi.";

    // 3. YANIT TEMİZLEME
    // Yanıt eğer 100 karakterden uzun gelirse backend'de kesiyoruz
    if (reply.length > 100) {
      reply = reply.substring(0, 100);
    }

    return res.status(200).json({ ok: true, reply });

  } catch (e) {
    return res.status(500).json({ error: "Sunucu hatası oluştu." });
  }
}
