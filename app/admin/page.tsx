import Link from "next/link";
import { env } from "cloudflare:workers";
import { chatGPTSignInPath, getChatGPTUser } from "../chatgpt-auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const user = await getChatGPTUser();
  const ownerEmail = env.OWNER_EMAIL ?? "taylorrbyt@gmail.com";

  if (user?.email.toLowerCase() === ownerEmail.toLowerCase()) redirect("/owner/");

  const signedInAsAnotherAccount = Boolean(user);
  return <main className="admin-login-shell">
    <section className="admin-login-card" aria-labelledby="admin-login-title">
      <Link className="admin-brand" href="/" aria-label="Back to NN Paving home">
        <span className="admin-brand-mark">NN</span>
        <span><strong>NN PAVING</strong><small>NORTHAMPTON</small></span>
      </Link>
      <p className="owner-kicker">PRIVATE ADMIN AREA</p>
      <h1 id="admin-login-title">Run the next job<br />from one place.</h1>
      <p className="admin-login-copy">Sign in to review quote enquiries, track follow-ups and keep every project conversation moving.</p>
      {signedInAsAnotherAccount ? <div className="admin-login-notice" role="alert"><strong>This account is not authorised.</strong><span>Sign out, then use the NN Paving owner account to continue.</span></div> : <Link className="owner-button admin-login-button" href={chatGPTSignInPath("/admin/")}>Sign in to admin <span aria-hidden="true">↗</span></Link>}
      <Link className="admin-back-link" href="/">Return to the public website</Link>
      <p className="admin-login-footnote">The admin area is private to the NN Paving owner account.</p>
    </section>
  </main>;
}
