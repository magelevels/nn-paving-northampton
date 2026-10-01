import { requireChatGPTUser } from "../chatgpt-auth";
import { env } from "cloudflare:workers";
import { ownerEmailConfigured } from "./access";
import OwnerDashboard from "./owner-dashboard";

export const dynamic = "force-dynamic";

export default async function OwnerPage() {
  if (!ownerEmailConfigured()) {
    return <main className="owner-shell"><div className="owner-card"><p className="owner-kicker">NN PAVING · OWNER AREA</p><h1>Owner access is not configured.</h1><p>The owner account setting is missing. Add <code>OWNER_EMAIL</code> before using the private inbox.</p></div></main>;
  }
  const user = await requireChatGPTUser("/owner/");
  const ownerEmail = env.OWNER_EMAIL as string;
  if (user.email.toLowerCase() !== ownerEmail.toLowerCase()) {
    return <main className="owner-shell"><div className="owner-card"><p className="owner-kicker">NN PAVING · OWNER AREA</p><h1>Owner access required.</h1><p>This private workspace is only available to the NN Paving owner account.</p></div></main>;
  }
  return <OwnerDashboard />;
}
