const eventLog = window.NNPavingEvents = window.NNPavingEvents || [];
const consentKey = "nn-paving-measurement-consent-v1";
const query = new URLSearchParams(window.location.search);
const cleanAttribution = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9_-]+/g, "-").slice(0, 60);
const attributionSource = cleanAttribution(query.get("utm_source")) || "website";
const attributionCampaign = cleanAttribution(query.get("utm_campaign"));
let measurementConsent = false;
try { measurementConsent = window.localStorage.getItem(consentKey) === "granted"; } catch {}

const sendMeasurement = (name) => {
  if (!measurementConsent) return;
  const payload = JSON.stringify({ name, path: window.location.pathname.slice(0, 120), source: attributionSource, campaign: attributionCampaign || null });
  try {
    if (navigator.sendBeacon) navigator.sendBeacon("/api/events", new Blob([payload], { type: "application/json" }));
    else void fetch("/api/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: payload, keepalive: true });
  } catch {}
};
const track = (name, detail = {}) => { eventLog.push({ name, ...detail, at: new Date().toISOString() }); sendMeasurement(name); };

const consentBanner = document.querySelector("#analytics-consent");
const setMeasurementConsent = (value) => {
  measurementConsent = value;
  try { window.localStorage.setItem(consentKey, value ? "granted" : "declined"); } catch {}
  if (consentBanner) consentBanner.hidden = true;
  if (value) sendMeasurement("consent_granted");
};
if (consentBanner) {
  let storedConsent = null;
  try { storedConsent = window.localStorage.getItem(consentKey); } catch {}
  if (!storedConsent) consentBanner.hidden = false;
  consentBanner.querySelector('[data-analytics-consent="accept"]')?.addEventListener("click", () => setMeasurementConsent(true));
  consentBanner.querySelector('[data-analytics-consent="decline"]')?.addEventListener("click", () => setMeasurementConsent(false));
}

document.addEventListener("click", (event) => {
  const target = event.target.closest?.("a,button");
  if (!target) return;
  const href = target.getAttribute("href") || "";
  if (href.startsWith("tel:")) track("phone_click");
  else if (href.startsWith("mailto:")) track("email_open");
  else if (href.includes("wa.me")) track("whatsapp_click");
  else if (href.includes("facebook.com")) track("facebook_click");
  else if (href.includes("instagram.com")) track("instagram_click");
  else if (href.includes("google.com/search")) track("google_click");
  else if (href === "/contact/" && !eventLog.some((item) => item.name === "quote_start")) track("quote_start");
  else if (target.matches("[data-photo]")) track("gallery_open");
});

const revealItems = document.querySelectorAll(".reveal");
if (matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
  revealItems.forEach((item) => item.classList.add("is-visible"));
} else {
  const revealObserver = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (entry.isIntersecting) { entry.target.classList.add("is-visible"); revealObserver.unobserve(entry.target); }
  }), { threshold: 0.14, rootMargin: "0px 0px -8%" });
  revealItems.forEach((item) => revealObserver.observe(item));
}

document.querySelectorAll("[data-before-after]").forEach((component) => {
  const range = component.querySelector('input[type="range"]');
  const setSplit = (value) => component.style.setProperty("--split", value + "%");
  if (range) { setSplit(range.value); range.addEventListener("input", () => setSplit(range.value)); }
});

const menu = document.querySelector(".menu-toggle");
const nav = document.querySelector(".nav");
const header = document.querySelector("header");
const setMenu = (open, focusLink = false) => {
  if (!menu || !nav) return;
  menu.setAttribute("aria-expanded", String(open));
  menu.setAttribute("aria-label", open ? "Close site menu" : "Open site menu");
  nav.classList.toggle("open", open);
  if (open && focusLink) nav.querySelector("a")?.focus();
};
menu?.addEventListener("click", () => setMenu(menu.getAttribute("aria-expanded") !== "true", true));
nav?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setMenu(false)));
document.addEventListener("click", (event) => { if (nav?.classList.contains("open") && !header?.contains(event.target)) setMenu(false); });
document.addEventListener("keydown", (event) => { if (event.key === "Escape" && nav?.classList.contains("open")) { setMenu(false); menu?.focus(); } });
window.addEventListener("resize", () => { if (window.innerWidth > 760 && nav?.classList.contains("open")) setMenu(false); });

document.querySelectorAll("[data-filter]").forEach((button) => button.addEventListener("click", () => {
  document.querySelectorAll("[data-filter]").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
  let count = 0;
  document.querySelectorAll("[data-category]").forEach((item) => { item.hidden = button.dataset.filter !== "all" && item.dataset.category !== button.dataset.filter; if (!item.hidden) count++; });
  const countLabel = document.querySelector("#gallery-count");
  if (countLabel) countLabel.textContent = count + " photograph" + (count === 1 ? "" : "s");
}));

const dialog = document.querySelector(".lightbox");
let photoTrigger;
document.querySelectorAll("[data-photo]").forEach((button) => button.addEventListener("click", () => {
  photoTrigger = button;
  document.querySelector("#large-photo").src = button.dataset.photo;
  document.querySelector("#large-photo").alt = button.querySelector("img").alt;
  document.querySelector("#large-caption").textContent = button.dataset.caption;
  dialog.showModal();
  dialog.querySelector("[data-close]")?.focus();
}));
document.querySelector("[data-close]")?.addEventListener("click", () => dialog.close());
dialog?.addEventListener("click", (event) => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } });
dialog?.addEventListener("close", () => photoTrigger?.focus());

const form = document.querySelector("#quote-form");
const attributionParams = new URLSearchParams(window.location.search);
const sourceField = form?.elements.source;
if (sourceField) sourceField.value = attributionCampaign ? attributionSource + "/" + attributionCampaign : attributionSource;
const quoteSteps = [...document.querySelectorAll("[data-quote-step]")];
const updateQuoteStage = (stage) => quoteSteps.forEach((step) => { const current = Number(step.dataset.quoteStep); if (current === stage) step.setAttribute("aria-current", "step"); else step.removeAttribute("aria-current"); step.dataset.complete = String(current < stage); });
let quoteStarted = false;
form?.addEventListener("focusin", () => { if (!quoteStarted && !eventLog.some((item) => item.name === "quote_start")) { quoteStarted = true; track("quote_start"); } updateQuoteStage(1); });
form?.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const fields = new FormData(form);
  const postcode = String(fields.get("postcode")).trim().toUpperCase();
  const postcodeField = form.elements.postcode;
  postcodeField.setCustomValidity("");
  if (!/^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i.test(postcode)) { postcodeField.setCustomValidity("Please enter a full UK postcode, such as NN1 1AA."); postcodeField.reportValidity(); return; }
  track("quote_review", { service: String(fields.get("service") || "") });
  const message = "Hello Leon,\n\nI would like a free quotation for " + fields.get("service") + ".\n\nProject priority: " + fields.get("goal") + "\nPractical notes: " + fields.get("site_notes") + "\nPreferred contact method: " + fields.get("contact_method") + "\nBest time to get back to me: " + fields.get("callback_time") + "\nSite visit request: " + fields.get("site_visit") + "\n\nName: " + String(fields.get("name")).trim() + "\nProperty postcode: " + postcode + "\nEmail: " + fields.get("email") + "\nPhone: " + (fields.get("phone") || "Not provided") + "\n\nProject details:\n" + String(fields.get("details")).trim() + "\n\nPlease confirm coverage, the next suitable step and any site visit arrangements. Thank you.";
  document.querySelector("#quote-message").value = message;
  document.querySelector("#email-enquiry").href = "mailto:NNPaving@gmail.com?subject=" + encodeURIComponent("Free quote enquiry — " + postcode) + "&body=" + encodeURIComponent(message);
  const result = document.querySelector("#quote-result");
  result.hidden = false; result.classList.remove("is-ready"); requestAnimationFrame(() => result.classList.add("is-ready"));
  updateQuoteStage(2);
  document.querySelector("#quote-status").textContent = "Not sent yet. Review the message, add photographs if helpful, then open your email app or copy the brief.";
  result.focus(); result.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "center" });
});
form?.addEventListener("submit", async () => {
  if (!form.reportValidity()) return;
  const payload = Object.fromEntries(new FormData(form).entries());
  const status = document.querySelector("#quote-status");
  try {
    const response = await fetch("/api/enquiries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (!response.ok) throw new Error("save failed");
    status.textContent = "Saved for Leon. Review the message, add photographs if helpful, then open your email app or copy the brief.";
    track("quote_saved");
  } catch {
    status.textContent = "Could not save online. Your message is still ready; open your email app or copy it.";
    track("quote_save_failed");
  }
});
form?.elements.postcode?.addEventListener("input", () => form.elements.postcode.setCustomValidity(""));
form?.addEventListener("input", () => { document.querySelector("#quote-result").hidden = true; updateQuoteStage(1); });
document.querySelector("#email-enquiry")?.addEventListener("click", () => { updateQuoteStage(3); document.querySelector("#quote-status").textContent = "Your email app should now be open. Add photographs if helpful, then press send to NNPaving@gmail.com."; });
document.querySelector("#copy-enquiry")?.addEventListener("click", async () => {
  const text = document.querySelector("#quote-message"); updateQuoteStage(3);
  try { await navigator.clipboard.writeText(text.value); document.querySelector("#quote-status").textContent = "Copied. Paste into an email addressed to NNPaving@gmail.com. Your enquiry has not been sent."; }
  catch { text.focus(); text.select(); document.querySelector("#quote-status").textContent = "Select and copy the message above, then paste it into your email service."; }
});
document.querySelector("#download-brief")?.addEventListener("click", () => {
  const text = document.querySelector("#quote-message")?.value || ""; if (!text) return;
  const postcode = String(form?.elements.postcode?.value || "project").trim().toUpperCase().replace(/[^A-Z0-9]+/g, "-");
  const blob = new Blob([text + "\n\nPhotos to add: wide view, access route, existing surface, steps or level changes.\n"], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "nn-paving-project-brief-" + postcode + ".txt"; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  document.querySelector("#quote-status").textContent = "Downloaded. The brief is saved on your device and has not been sent."; track("brief_download");
});
