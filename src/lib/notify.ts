import "server-only";
import { Resend } from "resend";
import { query } from "./db";
import type { MatchResult } from "./matching";

// Email and text alerts for new matches.
//
// Email sends for real through Resend (RESEND_API_KEY / RESEND_EMAIL_DOMAIN,
// provisioned via the Vercel Marketplace). Text alerts have no provider yet,
// so those are still written to the `notifications` table with status
// 'stubbed' instead of being sent -- fill in deliverText (e.g. Twilio) to wire
// those up too. The Admin > Buyers page shows this outbox either way.

import { APP_URL } from "./config";

type Recipient = { id: number; name: string; email: string | null; phone: string | null; alerts: string };
type ListingInfo = { id: number; complex: string; rent_monthly: number };

// Lazy init: reading RESEND_API_KEY at module load would crash `next build`
// if it's not set yet (e.g. before the integration is provisioned).
let resendClient: Resend | undefined;
function resend() {
  return resendClient ?? (resendClient = new Resend(process.env.RESEND_API_KEY));
}

async function deliverEmail(to: string, subject: string, body: string): Promise<"sent" | "failed"> {
  try {
    const { error } = await resend().emails.send({
      from: `Provo Contracts <alerts@${process.env.RESEND_EMAIL_DOMAIN}>`,
      to,
      subject,
      text: body,
    });
    if (error) {
      console.error(`[alert email failed] ${to}:`, error);
      return "failed";
    }
    return "sent";
  } catch (err) {
    console.error(`[alert email failed] ${to}:`, err);
    return "failed";
  }
}

function deliverText(_to: string, _body: string): "stubbed" {
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
    const status = channel === "email" ? await deliverEmail(to, `New match: ${l.complex}`, body) : deliverText(to, body);
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
