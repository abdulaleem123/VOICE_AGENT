import { LoginForm } from "@/components/LoginForm";
import Link from "next/link";

const NAVY = "#1e56cc";

export default function LoginPage() {
  return (
    <main className="min-h-screen grid lg:grid-cols-2">

      {/* ── LEFT — Plain White ── */}
      <section
        className="hidden lg:flex flex-col justify-between p-14"
        style={{ backgroundColor: "#ffffff" }}
      >
        {/* Logo + brand */}
        <div className="flex items-center gap-4">
          <img
            src="/logo.png"
            alt="Logo"
            style={{ width: 52, height: 52, objectFit: "contain", display: "block" }}
          />  
          <span style={{ color: NAVY, fontSize: "1.05rem", fontWeight: 700,
            letterSpacing: "0.22em", textTransform: "uppercase" }}>
            Voice Agent
          </span>
        </div>

        {/* Hero copy */}
        <div>
          <h2 style={{ color: "#1e56cc", fontSize: "3.5rem", fontWeight: 800,
            lineHeight: 1.15, margin: 0 }}>
            Talk, qualify,
            <br />
            hand off, book.
          </h2>

          <div style={{ width: 48, height: 3, backgroundColor: NAVY,
            borderRadius: 2, margin: "24px 0 20px" }} />

          <p style={{ color: "#3d5068", fontSize: "1rem", lineHeight: 1.7, maxWidth: 360 }}>
            Single-tenant operator console for inbound and outbound
            conversations powered by your OpenAI key.
          </p>

          <div style={{ marginTop: 32, display: "flex", flexWrap: "wrap", gap: 8 }}>
            {["Inbound", "Outbound", "Lead Qualify", "Auto Book"].map((tag) => (
              <span key={tag} style={{
                border: `1.5px solid ${NAVY}`, color: NAVY, borderRadius: 6,
                padding: "6px 14px", fontSize: "0.75rem", fontWeight: 600,
                letterSpacing: "0.04em",
              }}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p style={{ color: "#8a9ab0", fontSize: "0.78rem" }}>
          Are you an admin?{" "}
          <Link href="/admin/login" style={{ color: NAVY, fontWeight: 700,
            textDecoration: "underline", textUnderlineOffset: "3px" }}>
            Click here to login
          </Link>
        </p>
      </section>

      {/* ── RIGHT — Navy Blue ── */}
      <section className="flex items-center justify-center p-8"
        style={{ backgroundColor: NAVY }}>
        <div className="w-full max-w-md" style={{
          ["--bg"   as string]: "#ffffff",
          ["--bg-2" as string]: "#f4f7ff",
          ["--card" as string]: "#ffffff",
          ["--line" as string]: "rgba(30,86,204,0.1)",
          ["--text" as string]: NAVY,
          ["--muted"as string]: "#4a6080",
          ["--accent"as string]: "#1e56cc",
          backgroundColor: "#ffffff",
          borderRadius: 10,
          padding: "40px",
          boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
          backdropFilter: "none",
        }}>
          <LoginForm
            portal="user"
            title="Operator login"
            subtitle="Sign in to configure the agent, knowledge base, leads, and meetings."
            accent="cyan"
          />
        </div>
      </section>

    </main>
  );
}