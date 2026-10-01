import { env } from "cloudflare:workers";

const allowed = new Set([
  "name", "postcode", "service", "email", "phone", "goal", "site_notes",
  "contact_method", "callback_time", "site_visit", "details", "source",
  "privacy_acknowledged",
]);

const recent = new Map<string, number>();

function clean(value: unknown, max = 500): string {
  return String(value ?? "").trim().slice(0, max);
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 20_000) return Response.json({ error: "Enquiry is too large." }, { status: 413 });
  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Invalid enquiry" }, { status: 400 });
  }

  if (clean(payload.website_field)) return new Response(null, { status: 204 });

  const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
  const now = Date.now();
  const previous = recent.get(ip) ?? 0;
  if (now - previous < 20_000) {
    return Response.json({ error: "Please wait before sending another enquiry." }, { status: 429 });
  }

  const values = Object.fromEntries([...allowed].map((key) => [key, clean(payload[key], key === "details" ? 1500 : 240)]));
  const required = ["name", "postcode", "service", "email", "goal", "site_notes", "contact_method", "callback_time", "site_visit", "details"];
  if (required.some((key) => !values[key])) return Response.json({ error: "Please complete the required enquiry fields." }, { status: 400 });
  if (values.privacy_acknowledged !== "yes") return Response.json({ error: "Please acknowledge how your enquiry details will be used." }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) return Response.json({ error: "Please provide a valid email address." }, { status: 400 });
  if (!env.DB) return Response.json({ error: "Enquiry storage is temporarily unavailable." }, { status: 503 });

  const closedCutoff = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
  await env.DB.batch([
    env.DB.prepare("DELETE FROM enquiry_events WHERE enquiry_id IN (SELECT id FROM enquiries WHERE created_at < ? AND status IN ('won', 'lost'))").bind(closedCutoff),
    env.DB.prepare("DELETE FROM enquiries WHERE created_at < ? AND status IN ('won', 'lost')").bind(closedCutoff),
  ]);
  const id = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO enquiries (id, created_at, updated_at, name, postcode, service, email, phone, goal, site_notes, contact_method, callback_time, site_visit, details, source, status, consent_at, consent_version) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?)`)
      .bind(id, timestamp, timestamp, values.name, values.postcode.toUpperCase(), values.service, values.email, values.phone || null, values.goal, values.site_notes, values.contact_method, values.callback_time, values.site_visit, values.details, values.source || "website", timestamp, "quote-planner-v1"),
    env.DB.prepare(`INSERT INTO enquiry_events (id, enquiry_id, event_type, note, created_at) VALUES (?, ?, 'created', 'Enquiry received from the website.', ?)`)
      .bind(crypto.randomUUID(), id, timestamp),
  ]);
  recent.set(ip, now);
  return Response.json({ ok: true, id });
}
