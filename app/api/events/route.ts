import { env } from "cloudflare:workers";

const allowedEvents = new Set([
  "consent_granted", "phone_click", "email_open", "whatsapp_click", "facebook_click",
  "instagram_click", "google_click", "quote_start", "quote_review", "quote_saved",
  "quote_save_failed", "gallery_open", "brief_download",
]);

function clean(value: unknown, max: number): string {
  return String(value ?? "").trim().slice(0, max);
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 4_000) return Response.json({ error: "Event is too large." }, { status: 413 });
  let payload: Record<string, unknown>;
  try { payload = await request.json(); } catch { return Response.json({ error: "Invalid event." }, { status: 400 }); }

  const eventName = clean(payload.name, 40);
  if (!allowedEvents.has(eventName)) return Response.json({ error: "Unsupported event." }, { status: 400 });
  if (!env.DB) return Response.json({ error: "Measurement is temporarily unavailable." }, { status: 503 });

  const eventCutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const source = clean(payload.source, 60).replace(/[^a-z0-9_-]/gi, "-") || "website";
  const campaign = clean(payload.campaign, 60).replace(/[^a-z0-9_-]/gi, "-") || null;
  const path = clean(payload.path, 120).replace(/[^a-z0-9_/?=&%.-]/gi, "") || "/";
  await env.DB.batch([
    env.DB.prepare("DELETE FROM site_events WHERE created_at < ?").bind(eventCutoff),
    env.DB.prepare("INSERT INTO site_events (id, created_at, event_name, path, source, campaign) VALUES (?, ?, ?, ?, ?, ?)")
      .bind(crypto.randomUUID(), new Date().toISOString(), eventName, path, source, campaign),
  ]);
  return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
