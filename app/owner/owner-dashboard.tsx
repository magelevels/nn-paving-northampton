"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

type Enquiry = {
  id: string; created_at: string; name: string; postcode: string; service: string;
  email: string; phone: string | null; goal: string; site_notes: string;
  contact_method: string; callback_time: string; site_visit: string; details: string;
  source: string; status: string; next_action_date: string | null; next_action_note: string | null;
};
type SiteMetric = { event_name: string; source: string; count: number };

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
  const [newAlert, setNewAlert] = useState("");
  const [metrics, setMetrics] = useState<SiteMetric[]>([]);
  const previousNewCount = useRef<number | null>(null);

  const load = async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/owner/enquiries", { cache: "no-store" });
      if (!response.ok) throw new Error(await response.text());
      const enquiryPayload = await response.json() as { enquiries?: Enquiry[] };
      const enquiries: Enquiry[] = enquiryPayload.enquiries ?? [];
      const incomingNewCount = enquiries.filter((item) => item.status === "new").length;
      if (previousNewCount.current !== null && incomingNewCount > previousNewCount.current) { const added = incomingNewCount - previousNewCount.current; setNewAlert(`${added} ${added === 1 ? "new enquiry" : "new enquiries"} received`); }
      previousNewCount.current = incomingNewCount;
      setItems(enquiries);
      const metricsResponse = await fetch("/api/owner/metrics", { cache: "no-store" });
      if (metricsResponse.ok) setMetrics(((await metricsResponse.json()) as { events?: SiteMetric[] }).events ?? []);
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
  const today = new Date().toISOString().slice(0, 10);
  const overdueCount = useMemo(() => items.filter((item) => !["won", "lost"].includes(item.status) && Boolean(item.next_action_date) && (item.next_action_date ?? "") < today).length, [items, today]);
  const sourceCounts = useMemo(() => items.reduce<Record<string, number>>((counts, item) => { const source = item.source || "website"; counts[source] = (counts[source] ?? 0) + 1; return counts; }, {}), [items]);

  useEffect(() => {
    document.title = newCount ? `(${newCount}) ${newCount === 1 ? "New enquiry" : "New enquiries"} · NN Paving` : "Owner inbox · NN Paving";
  }, [newCount]);

  useEffect(() => {
    const refreshTimer = window.setInterval(() => { void load(); }, 60_000);
    return () => window.clearInterval(refreshTimer);
  }, []);

  const save = async (item: Enquiry, form: HTMLFormElement) => {
    const data = new FormData(form);
    setSaved("");
    const response = await fetch("/api/owner/enquiries", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: item.id, status: data.get("status"), nextActionDate: data.get("nextActionDate"), nextActionNote: data.get("nextActionNote") }) });
    if (!response.ok) { setError("That update could not be saved."); return; }
    setSaved("Saved"); await load(); setTimeout(() => setSaved(""), 1800);
  };

  const remove = async (item: Enquiry) => {
    if (!window.confirm(`Delete the enquiry from ${item.name}? This also removes its timeline.`)) return;
    const response = await fetch(`/api/owner/enquiries?id=${encodeURIComponent(item.id)}`, { method: "DELETE" });
    if (!response.ok) { setError("That enquiry could not be deleted."); return; }
    setSaved("Enquiry deleted");
    await load();
    window.setTimeout(() => setSaved(""), 1800);
  };

  return <main className="owner-shell"><div className="owner-wrap">
    <header className="owner-header"><div><p className="owner-kicker">NN PAVING · OWNER AREA</p><h1>Today’s enquiries</h1><p>Welcome back, Leon Read. {openCount} open {openCount === 1 ? "enquiry needs" : "enquiries need"} attention.</p></div><Link className="owner-muted" href="/signout-with-chatgpt?return_to=/">Sign out</Link></header>
    {saved && <p className="owner-success" role="status">{saved}</p>}
    {newAlert && <p className="owner-success owner-alert" role="status">{newAlert} <button className="owner-alert-dismiss" type="button" onClick={() => setNewAlert("")}>Dismiss</button></p>}
    {error && <p className="owner-error" role="alert">{error} <button className="owner-button" onClick={() => void load()}>Try again</button></p>}
    <section className="owner-toolbar"><div><strong>Owner inbox</strong>{newCount > 0 && <span className="owner-new-badge">{newCount} new</span>}{overdueCount > 0 && <span className="owner-overdue-badge">{overdueCount} overdue</span>}<span> New enquiries appear here after a customer reviews the quote planner.</span>{lastChecked && <small className="owner-checked">Last checked {lastChecked.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} · refreshes every minute</small>}</div><div className="owner-toolbar-actions"><Link className="owner-muted" href="/contact/">Test customer journey ↗</Link><button className="owner-button" onClick={() => void load()}>Refresh</button></div></section>
    {items.length > 0 && <section className="owner-metrics" aria-label="Enquiry overview"><div><strong>{newCount}</strong><span>New</span></div><div><strong>{overdueCount}</strong><span>Overdue follow-ups</span></div><div><strong>{openCount}</strong><span>Open</span></div><div className="owner-source-metric"><strong>Sources</strong><span>{Object.entries(sourceCounts).map(([source, count]) => <button type="button" key={source} onClick={() => setSourceFilter(source)}>{source} · {count}</button>)}</span></div></section>}
    <section className="owner-content-card owner-growth-card"><div><strong>Anonymous website signals · last 30 days</strong><p>Only visitors who allowed measurement are included. No names, email addresses or message content are stored here.</p></div><div className="owner-growth-metrics">{metrics.length === 0 ? <span>No consented events yet.</span> : metrics.slice(0, 6).map((metric) => <span key={`${metric.event_name}-${metric.source}`}><strong>{metric.count}</strong> {metric.event_name.replaceAll("_", " ")} <small>· {metric.source}</small></span>)}</div></section>
    <section className="owner-content-card"><div><strong>Keep building proof</strong><p>After a finished job, save a wide photo, a detail photo and the customer’s permission before adding a new project story.</p></div><div><Link href="/projects/driveway-foundation/">View driveway story ↗</Link><Link href="/projects/garden-transformation/">View garden story ↗</Link></div></section>
    {loading ? <div className="owner-loading">Loading your enquiries…</div> : items.length === 0 ? <div className="owner-empty"><h2>No enquiries yet</h2><p>When a customer submits the quote planner, their details will appear here with a next action.</p><Link className="owner-button owner-inline-button" href="/contact/">Open the customer quote journey ↗</Link></div> : <><div className="owner-filter"><label htmlFor="source-filter">Show enquiries from<select id="source-filter" value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)}>{sources.map((source) => <option key={source} value={source}>{source === "all" ? "All sources" : source}</option>)}</select></label><span>{visibleItems.length} shown · {items.length} total</span></div>{visibleItems.length === 0 ? <div className="owner-empty"><h2>No enquiries from this source</h2><p>Choose another source to view the rest of the inbox.</p></div> : <div className="owner-list">{visibleItems.map((item) => <article className={`owner-row ${!['won', 'lost'].includes(item.status) && Boolean(item.next_action_date) && (item.next_action_date ?? "") < today ? "owner-row-overdue" : ""}`} key={item.id}>
      <div className="owner-row-top"><div><h2>{item.name} · {item.service}</h2><div className="owner-meta">{item.postcode} · received {new Date(item.created_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })} · source: {item.source}</div></div><span className="owner-status-pill">{labels[item.status] ?? item.status}</span></div>
      <div className="owner-details"><div className="owner-detail"><small>Contact</small><strong>{item.contact_method} · {item.callback_time}</strong></div><div className="owner-detail"><small>Site visit</small><strong>{item.site_visit}</strong></div><div className="owner-detail"><small>Email</small><strong><a href={`mailto:${item.email}`}>{item.email}</a></strong></div><div className="owner-detail"><small>Phone</small><strong>{item.phone || "Not provided"}</strong></div></div>
      <p><strong>Priority:</strong> {item.goal} · <strong>Practical note:</strong> {item.site_notes}</p><p>{item.details}</p>
      <form className="owner-actions" onSubmit={(event) => { event.preventDefault(); void save(item, event.currentTarget); }}><select className="owner-status" name="status" defaultValue={item.status} aria-label={`Status for ${item.name}`}>{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><input type="date" name="nextActionDate" defaultValue={item.next_action_date ?? ""} aria-label={`Next action date for ${item.name}`} /><textarea name="nextActionNote" defaultValue={item.next_action_note ?? ""} placeholder="Next action or note" aria-label={`Next action note for ${item.name}`} /><button className="owner-button" type="submit">Save update</button><button className="owner-button owner-delete-button" type="button" onClick={() => void remove(item)}>Delete record</button></form>
    </article>)}</div>}</>}
  </div></main>;
}
