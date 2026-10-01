import { env } from "cloudflare:workers";
import { checkOwnerAccess } from "../../../owner/access";

const statuses = new Set(["new", "contacted", "site_visit_requested", "quoted", "awaiting_client", "won", "lost"]);

async function ownerOnly() {
  const access = await checkOwnerAccess();
  if (!access.ok) {
    const message = access.status === 503 ? "Owner access is not configured." : access.status === 401 ? "Sign-in required" : "Owner access required";
    return new Response(message, { status: access.status, headers: { "Cache-Control": "no-store" } });
  }
  return null;
}

export async function GET() {
  const denied = await ownerOnly();
  if (denied) return denied;
  if (!env.DB) return Response.json({ error: "Owner data is temporarily unavailable." }, { status: 503 });
  const result = await env.DB.prepare(`SELECT id, created_at, updated_at, name, postcode, service, email, phone, goal, site_notes, contact_method, callback_time, site_visit, details, source, status, next_action_date, next_action_note FROM enquiries ORDER BY CASE status WHEN 'new' THEN 0 WHEN 'contacted' THEN 1 WHEN 'site_visit_requested' THEN 2 WHEN 'quoted' THEN 3 WHEN 'awaiting_client' THEN 4 WHEN 'won' THEN 5 ELSE 6 END, created_at DESC`).all();
  return Response.json({ enquiries: result.results }, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(request: Request) {
  const denied = await ownerOnly();
  if (denied) return denied;
  if (!env.DB) return Response.json({ error: "Owner data is temporarily unavailable." }, { status: 503 });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return Response.json({ error: "Invalid update." }, { status: 400 }); }
  const id = String(body.id ?? "").trim();
  const status = String(body.status ?? "").trim();
  const nextActionDate = String(body.nextActionDate ?? "").trim().slice(0, 30) || null;
  const nextActionNote = String(body.nextActionNote ?? "").trim().slice(0, 500) || null;
  if (!id || !statuses.has(status)) return Response.json({ error: "Choose a valid enquiry status." }, { status: 400 });
  const timestamp = new Date().toISOString();
  await env.DB.batch([
    env.DB.prepare(`UPDATE enquiries SET status = ?, next_action_date = ?, next_action_note = ?, updated_at = ? WHERE id = ?`).bind(status, nextActionDate, nextActionNote, timestamp, id),
    env.DB.prepare(`INSERT INTO enquiry_events (id, enquiry_id, event_type, note, created_at) VALUES (?, ?, 'updated', ?, ?)`).bind(crypto.randomUUID(), id, `Status changed to ${status}.`, timestamp),
  ]);
  return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}

export async function DELETE(request: Request) {
  const denied = await ownerOnly();
  if (denied) return denied;
  if (!env.DB) return Response.json({ error: "Owner data is temporarily unavailable." }, { status: 503 });
  const id = new URL(request.url).searchParams.get("id")?.trim() ?? "";
  if (!id || id.length > 80) return Response.json({ error: "Choose a valid enquiry." }, { status: 400 });
  await env.DB.batch([
    env.DB.prepare("DELETE FROM enquiry_events WHERE enquiry_id = ?").bind(id),
    env.DB.prepare("DELETE FROM enquiries WHERE id = ?").bind(id),
  ]);
  return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
