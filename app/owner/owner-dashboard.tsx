"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Enquiry = {
  id: string; created_at: string; name: string; postcode: string; service: string;
  email: string; phone: string | null; goal: string; site_notes: string;
  contact_method: string; callback_time: string; site_visit: string; details: string;
  source: string; status: string; next_action_date: string | null; next_action_note: string | null;
};

const labels: Record<string, string> = {
  new: "New", contacted: "Contacted", site_visit_requested: "Site visit requested",
  quoted: "Quoted", awaiting_client: "Awaiting client", won: "Won", lost: "Lost",
};

export default function OwnerDashboard() {
  const [items, setItems] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const load = async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/owner/enquiries", { cache: "no-store" });
      if (!response.ok) throw new Error(await response.text());
      setItems((await response.json()).enquiries ?? []);
      setLastChecked(new Date());
    } catch { setError("The owner inbox could not be loaded. Try again in a moment."); }
    finally { setLoading(false); }
  };

  // The initial fetch synchronises the client view with the owner inbox.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, []);
  const openCount = useMemo(() => items.filter((item) => !["won", "lost"].includes(item.status)).length, [items]);
  const newCount = useMemo(() => items.filter((item) => item.status === "new").length, [items]);
  const sources = useMemo(() => ["all", ...new Set(items.map((item) => item.source || "website"))], [items]);
  const visibleItems = useMemo(() => sourceFilter === "all" ? items : items.filter((item) => (item.source || "website") === sourceFilter), [items, sourceFilter]);

  useEffect(() => {
    document.title = newCount ? `(${newCount}) ${newCount === 1 ? "New enquiry" : "New enquiries"} · NN Paving` : "Owner inbox · NN Paving";
  }, [newCount]);

  const save = async (item: Enquiry, form: HTMLFormElement) => {
    const data = new FormData(form);
    setSaved("");
    const response = await fetch("/api/owner/enquiries", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: item.id, status: data.get("status"), nextActionDate: data.get("nextActionDate"), nextActionNote: data.get("nextActionNote") }) });
    if (!response.ok) { setError("That update could not be saved."); return; }
    setSaved("Saved"); await load(); setTimeout(() => setSaved(""), 1800);
  };

  return <main className="owner-shell"><div className="owner-wrap">
    <header className="owner-header"><div><p className="owner-kicker">NN PAVING · OWNER AREA</p><h1>Today’s enquiries</h1><p>Welcome back, Leon Read. {openCount} open {openCount === 1 ? "enquiry needs" : "enquiries need"} attention.</p></div><Link className="owner-muted" href="/signout-with-chatgpt?return_to=/">Sign out</Link></header>
    {saved && <p className="owner-success" role="status">{saved}</p>}
    {error && <p className="owner-error" role="alert">{error} <button className="owner-button" onClick={() => void load()}>Try again</button></p>}
    <section className="owner-toolbar"><div><strong>Owner inbox</strong>{newCount > 0 && <span className="owner-new-badge">{newCount} new</span>}<span> New enquiries appear here after a customer reviews the quote planner.</span>{lastChecked && <small className="owner-checked">Last checked {lastChecked.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</small>}</div><div className="owner-toolbar-actions"><Link className="owner-muted" href="/contact/">Test customer journey ↗</Link><button className="owner-button" onClick={() => void load()}>Refresh</button></div></section>
    {loading ? <div className="owner-loading">Loading your enquiries…</div> : items.length === 0 ? <div className="owner-empty"><h2>No enquiries yet</h2><p>When a customer submits the quote planner, their details will appear here with a next action.</p><Link className="owner-button owner-inline-button" href="/contact/">Open the customer quote journey ↗</Link></div> : <><div className="owner-filter"><label htmlFor="source-filter">Show enquiries from<select id="source-filter" value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)}>{sources.map((source) => <option key={source} value={source}>{source === "all" ? "All sources" : source}</option>)}</select></label><span>{visibleItems.length} shown · {items.length} total</span></div>{visibleItems.length === 0 ? <div className="owner-empty"><h2>No enquiries from this source</h2><p>Choose another source to view the rest of the inbox.</p></div> : <div className="owner-list">{visibleItems.map((item) => <article className="owner-row" key={item.id}>
      <div className="owner-row-top"><div><h2>{item.name} · {item.service}</h2><div className="owner-meta">{item.postcode} · received {new Date(item.created_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })} · source: {item.source}</div></div><span className="owner-status-pill">{labels[item.status] ?? item.status}</span></div>
      <div className="owner-details"><div className="owner-detail"><small>Contact</small><strong>{item.contact_method} · {item.callback_time}</strong></div><div className="owner-detail"><small>Site visit</small><strong>{item.site_visit}</strong></div><div className="owner-detail"><small>Email</small><strong><a href={`mailto:${item.email}`}>{item.email}</a></strong></div><div className="owner-detail"><small>Phone</small><strong>{item.phone || "Not provided"}</strong></div></div>
      <p><strong>Priority:</strong> {item.goal} · <strong>Practical note:</strong> {item.site_notes}</p><p>{item.details}</p>
      <form className="owner-actions" onSubmit={(event) => { event.preventDefault(); void save(item, event.currentTarget); }}><select className="owner-status" name="status" defaultValue={item.status} aria-label={`Status for ${item.name}`}>{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><input type="date" name="nextActionDate" defaultValue={item.next_action_date ?? ""} aria-label={`Next action date for ${item.name}`} /><textarea name="nextActionNote" defaultValue={item.next_action_note ?? ""} placeholder="Next action or note" aria-label={`Next action note for ${item.name}`} /><button className="owner-button" type="submit">Save update</button></form>
    </article>)}</div>}</>}
  </div></main>;
}
