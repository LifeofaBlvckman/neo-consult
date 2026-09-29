// Neo Consult website assistant — Vercel serverless function.
// The Anthropic API key lives ONLY here, read from the ANTHROPIC_API_KEY environment variable
// (Vercel → Project → Settings → Environment Variables). It is never sent to the browser.

const MODEL = process.env.CLAUDE_MODEL || 'claude-haiku-4-5-20251001';
const MAX_HISTORY = 12;          // messages kept per request
const MAX_CHARS = 1200;          // per message
const RATE_LIMIT = 20;           // requests per IP ...
const RATE_WINDOW_MS = 10 * 60 * 1000; // ... per 10 minutes (per warm instance)
const hits = new Map();

const FACTS = `
ABOUT NEO CONSULT
- Study-abroad and education consultancy with two offices:
  - Abuja office: 2 Eden Close, Redeemer Estate, Abuja, Nigeria
  - Leeds office: Park House, 24 Park Square W, Leeds, LS1 2PW, United Kingdom
- Email: theneoconsult@gmail.com · Phone: +234 816 010 0708
- The first consultation is free. Students are guided from choosing a course to settling in abroad; the Leeds team supports students after arrival in the UK.
- Figures shown on the website: 500+ students guided, 50+ partner universities, 95% visa success rate.

SERVICES (website pages in brackets)
- University & college admissions: course and university matching, application strategy, personal statement and reference support, UCAS and direct applications (services.html#admissions)
- Visa & immigration support: document checklists, financial and sponsorship letter guidance, mock visa interviews (services.html#visa)
- Test preparation: IELTS, TOEFL and SAT coaching, mock tests, one-on-one feedback, in person in Abuja or online (services.html#test-prep)
- Scholarship guidance: finding and applying for scholarships and funding, essays and interviews (services.html#scholarships)
- School placement: secondary and boarding school placement for younger students (services.html#school-placement)
- Pre-departure & settlement: flights, accommodation, orientation, check-ins after arrival (services.html#pre-departure)
- Also: career advice and accommodation search.

DESTINATIONS
United Kingdom (most popular), Ireland, Canada, Australia, United States, New Zealand, Spain, Malta.

BOOKING
Free consultation: contact.html. About the company: about.html. All services: services.html.
`;

const PERSONAS = {
  ada: 'You are Ada, Neo Consult\'s Admissions Guide. You focus on choosing courses, countries and universities, entry requirements, costs in general terms, and getting applications started.',
  tobi: 'You are Tobi, Neo Consult\'s Visa & Travel Guide. You focus on student visas, documents, English tests (IELTS/TOEFL), accommodation, travel and settling in abroad.'
};

function systemPrompt(agent) {
  return `${PERSONAS[agent] || PERSONAS.ada}
You are a virtual assistant (an AI) on the Neo Consult website, talking with prospective students and parents, mostly from Nigeria. Never claim to be human.

${FACTS}

HOW TO REPLY
- Be warm, clear and brief: usually 2–5 short sentences, under 120 words. Use a short bulleted list ("- ") only when listing options.
- You may use **bold** sparingly and link to the website pages above with markdown links, e.g. [book a free consultation](contact.html). Only link to the pages listed above.
- Only state facts about Neo Consult that are listed above. If you don't know (fees, specific partner universities, office hours, staff names), say a counsellor can confirm and point to [a free consultation](contact.html).
- Visa rules, tuition, funds requirements and work rights change often and depend on the country and the student's situation. Give general guidance only, never guarantee a visa or admission outcome, and recommend checking the official government website or speaking with a counsellor for specifics.
- Stay on study-abroad topics. Politely decline unrelated requests and steer back.
- When a student seems ready or asks something personal to their case, invite them to book the free consultation.`;
}

function clientIp(req) {
  const xf = req.headers['x-forwarded-for'];
  return (Array.isArray(xf) ? xf[0] : (xf || '')).split(',')[0].trim() || (req.socket && req.socket.remoteAddress) || 'unknown';
}

function rateLimited(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter(t => now - t < RATE_WINDOW_MS);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > RATE_LIMIT;
}

function cleanMessages(raw) {
  if (!Array.isArray(raw)) return null;
  const msgs = raw
    .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map(m => ({ role: m.role, content: m.content.trim().slice(0, MAX_CHARS) }))
    .filter(m => m.content)
    .slice(-MAX_HISTORY);
  while (msgs.length && msgs[0].role !== 'user') msgs.shift();   // must start with the user
  // merge consecutive same-role messages so roles alternate
  const out = [];
  for (const m of msgs) {
    if (out.length && out[out.length - 1].role === m.role) out[out.length - 1].content += '\n' + m.content;
    else out.push(m);
  }
  if (!out.length || out[out.length - 1].role !== 'user') return null;
  return out;
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const allowed = process.env.ALLOWED_ORIGIN;              // optional, e.g. https://neoconsult.vercel.app
  if (allowed && req.headers.origin && req.headers.origin !== allowed) {
    return res.status(403).json({ error: 'forbidden' });
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }
  if (!process.env.ANTHROPIC_API_KEY) return res.status(503).json({ error: 'not_configured' });
  if (rateLimited(clientIp(req))) return res.status(429).json({ error: 'rate_limited' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = null; } }
  const messages = cleanMessages(body && body.messages);
  if (!messages) return res.status(400).json({ error: 'bad_request' });
  const agent = body.agent === 'tobi' ? 'tobi' : 'ada';

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({ model: MODEL, max_tokens: 400, system: systemPrompt(agent), messages })
    });
    if (!r.ok) {
      console.error('Anthropic API error', r.status, (await r.text()).slice(0, 300));
      return res.status(502).json({ error: 'upstream_error' });
    }
    const data = await r.json();
    const reply = (data.content || []).filter(c => c.type === 'text').map(c => c.text).join('\n').trim();
    if (!reply) return res.status(502).json({ error: 'empty_reply' });
    return res.status(200).json({ reply });
  } catch (err) {
    console.error('Chat function failed', err && err.message);
    return res.status(500).json({ error: 'server_error' });
  }
};

module.exports._test = { cleanMessages, systemPrompt };
