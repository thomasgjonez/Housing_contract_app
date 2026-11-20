import "server-only";
import { query } from "./db";
import type { MatchResult } from "./matching";

// Email and text alerts for new matches.
//
// No email or SMS provider is connected yet, so every alert is written to the
// `notifications` table with status 'stubbed' and printed in the terminal.
// The Admin > Buyers page shows this outbox. To send for real, fill in
// deliverEmail / deliverText (for example Resend or SendGrid for email, Twilio
// for texts) and set status to 'sent' when the provider accepts it.

import { APP_URL } from "./config";

type Recipient = { id: number; name: string; email: string | null; phone: string | null; alerts: string };
type ListingInfo = { id: number; complex: string; rent_monthly: number };

function deliverEmail(_to: string, _subject: string, _body: string): "sent" | "stubbed" {
  return "stubbed";
}

function deliverText(_to: string, _body: string): "sent" | "stubbed" {
  return "stubbed";
}

export async function sendMatchAlert(p: Recipient, l: ListingInfo, m: MatchResult) {
  const first = p.name.replace(/^Sample:\s*/, "").split(" ")[0];
  const why = m.reasons.length ? ` ${m.reasons.join(", ")}.` : "";
  const body = `Hi ${first}, a new contract matches what you're looking for (${m.score}% match): ${l.complex}, $${l.rent_monthly}/mo.${why} ${APP_URL}/listings/${l.id}`;
  const channels: ["email" | "text", string | null][] = [];
  if (p.alerts === "email" || p.alerts === "both") channels.push(["email", p.email]);
  if (p.alerts === "text" || p.alerts === "both") channels.push(["text", p.phone]);
  for (const [channel, to] of channels) {
    if (!to) continue;
    const status = channel === "email" ? deliverEmail(to, `New match: ${l.complex}`, body) : deliverText(to, body);
    await query("INSERT INTO notifications (profile_id, listing_id, channel, to_address, body, status) VALUES ($1, $2, $3, $4, $5, $6)", [
      p.id,
      l.id,
      channel,
      to,
      body,
      status,
    ]);
    console.log(`[alert ${status}] ${channel} to ${to}: ${body}`);
  }
}
