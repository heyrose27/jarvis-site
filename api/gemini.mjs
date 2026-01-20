document.getElementById('sendBtn').addEventListener('click', async () => {
  const txt = document.getElementById('promptInput').value.trim();
  if (!txt) return alert('Bir şey yaz.');

  try {
    const r = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: `Mod: ${mode}\nİstek: ${txt}` })
    });

    const raw = await r.text();
    let data;
    try { data = JSON.parse(raw); }
    catch { data = { error: raw }; }

    if (!r.ok) return alert(data?.error || ('Hata: ' + r.status));

    alert(data.reply || 'Cevap gelmedi');
  } catch (e) {
    alert('Bağlantı hatası: ' + e);
  }
});
