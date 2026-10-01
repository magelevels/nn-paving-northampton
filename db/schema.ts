import { sql } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const enquiries = sqliteTable("enquiries", {
  id: text("id").primaryKey(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  name: text("name").notNull(),
  postcode: text("postcode").notNull(),
  service: text("service").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  goal: text("goal").notNull(),
  siteNotes: text("site_notes").notNull(),
  contactMethod: text("contact_method").notNull(),
  callbackTime: text("callback_time").notNull(),
  siteVisit: text("site_visit").notNull(),
  details: text("details").notNull(),
  source: text("source").notNull().default("website"),
  status: text("status").notNull().default("new"),
  nextActionDate: text("next_action_date"),
  nextActionNote: text("next_action_note"),
  consentAt: text("consent_at"),
  consentVersion: text("consent_version"),
});

export const enquiryEvents = sqliteTable("enquiry_events", {
  id: text("id").primaryKey(),
  enquiryId: text("enquiry_id").notNull(),
  eventType: text("event_type").notNull(),
  note: text("note"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const siteEvents = sqliteTable("site_events", {
  id: text("id").primaryKey(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  eventName: text("event_name").notNull(),
  path: text("path").notNull(),
  source: text("source").notNull().default("website"),
  campaign: text("campaign"),
});
