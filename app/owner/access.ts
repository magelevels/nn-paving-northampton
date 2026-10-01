import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../chatgpt-auth";

export type OwnerAccess =
  | { ok: true; user: Awaited<ReturnType<typeof getChatGPTUser>> & object }
  | { ok: false; status: 401 | 403 | 503 };

export async function checkOwnerAccess(): Promise<OwnerAccess> {
  const configuredEmail = env.OWNER_EMAIL?.trim().toLowerCase();
  if (!configuredEmail) return { ok: false, status: 503 };

  const user = await getChatGPTUser();
  if (!user) return { ok: false, status: 401 };
  if (user.email.trim().toLowerCase() !== configuredEmail) {
    return { ok: false, status: 403 };
  }
  return { ok: true, user };
}

export function ownerEmailConfigured(): boolean {
  return Boolean(env.OWNER_EMAIL?.trim());
}
