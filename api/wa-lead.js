const TO = "zitagadelha@gmail.com";
const FROM = process.env.RESEND_FROM || "Zita Psi <beth.t@example.com>";
const SUPABASE_URL = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";

const ALLOWED_ORIGINS = [
  "https://www.zitapsi.com.br",
  "https://zitapsi.com.br",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
];

// ponytail: rate limit em memória; some em vários isolates serverless se spam crescer
const hits = new Map();
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 5;
const MIN_FILL_MS = 2500;

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function clientIp(req) {
  const xf = req.headers["x-forwarded-for"];
  if (typeof xf === "string" && xf.trim()) return xf.split(",")[0].trim();
  return req.socket?.remoteAddress || "unknown";
}

function tooMany(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  if (list.length >= RATE_MAX) {
    hits.set(ip, list);
    return true;
  }
  list.push(now);
  hits.set(ip, list);
  return false;
}

function originOk(req) {
  const origin = String(req.headers.origin || "");
  const referer = String(req.headers.referer || "");
  if (!origin && !referer) return true;
  if (origin && ALLOWED_ORIGINS.some((o) => origin === o)) return true;
  if (referer && ALLOWED_ORIGINS.some((o) => referer.startsWith(o + "/") || referer === o)) {
    return true;
  }
  return false;
}

function cors(res, req) {
  const origin = String(req.headers.origin || "");
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

async function insertLead(row) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY missing");
  }
  const response = await fetch(SUPABASE_URL + "/rest/v1/wa_leads", {
    method: "POST",
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: "Bearer " + SUPABASE_SERVICE_ROLE_KEY,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(row),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error("Supabase insert failed: " + response.status + " " + detail);
  }
}

async function sendEmail({ nome, email, telefone, questao, page }) {
  if (!RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY missing");
  }
  const html = `
    <h2>Novo lead do site</h2>
    <p><strong>Nome:</strong> ${escapeHtml(nome)}</p>
    <p><strong>E-mail:</strong> ${escapeHtml(email)}</p>
    <p><strong>Telefone:</strong> ${escapeHtml(telefone)}</p>
    <p><strong>Motivo da busca:</strong><br>${escapeHtml(questao).replace(/\n/g, "<br>")}</p>
    <p><strong>Página:</strong> ${escapeHtml(page)}</p>
  `;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + RESEND_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM,
      to: [TO],
      reply_to: email,
      subject: "Novo lead: " + nome,
      html,
    }),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error("Resend failed: " + response.status + " " + detail);
  }
}

module.exports = async function handler(req, res) {
  cors(res, req);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!originOk(req)) {
    return res.status(403).json({ error: "Origin not allowed" });
  }

  const ip = clientIp(req);
  if (tooMany(ip)) {
    return res.status(429).json({ error: "Too many requests" });
  }

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body || "{}");
    } catch (err) {
      return res.status(400).json({ error: "Invalid JSON" });
    }
  }
  body = body || {};

  // honeypot: bots preenchem; responde ok sem gravar
  if (body.website) {
    return res.status(200).json({ ok: true });
  }

  const openedAt = Number(body.openedAt || 0);
  if (!openedAt || Date.now() - openedAt < MIN_FILL_MS) {
    return res.status(400).json({ error: "Too fast" });
  }

  const questao = String(body.questao || "").trim().slice(0, 2000);
  const nome = String(body.nome || "").trim().slice(0, 120);
  const email = String(body.email || "").trim().slice(0, 160).toLowerCase();
  const telefone = String(body.telefone || "").trim().slice(0, 40);
  const page = String(body.page || "").trim().slice(0, 500);

  if (!questao || !nome || !email || !telefone) {
    return res.status(400).json({ error: "Campos obrigatórios faltando" });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "E-mail inválido" });
  }

  const row = { questao, nome, email, telefone, page };

  try {
    await insertLead(row);
  } catch (err) {
    console.error(err);
    return res.status(502).json({ error: "Falha ao gravar lead" });
  }

  try {
    await sendEmail(row);
  } catch (err) {
    console.error(err);
    // lead já gravado; não falha o fluxo do cliente por e-mail
  }

  return res.status(200).json({ ok: true });
};
