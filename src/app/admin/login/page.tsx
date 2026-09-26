import { LoginForm } from "@/components/LoginForm";
import Link from "next/link";

export default function AdminLoginPage() {
  return (
    <main className="min-h-screen grid lg:grid-cols-2">

      {/* ── LEFT  Textured White ── */}
      <section
        className="hidden lg:flex flex-col justify-between p-14"
        style={{
          backgroundColor: "#ffffff",
          // backgroundImage: "radial-gradient(circle at 1px 1px, #ced3de 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      >
        {/* Logo + brand */}
        <div className="flex items-center gap-4">
          <img
            src="/logo.png"
            alt="Logo"
            style={{ width: 52, height: 52, objectFit: "contain", display: "block" }}
          />
          <span
            style={{
              color: "#1e56cc",
              fontSize: "1.05rem",
              fontWeight: 700,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
            }}
          >
            Super Admin
          </span>
        </div>

        {/* Hero copy */}
        <div>
          <h2
            style={{
              color: "#1e56cc",
              fontSize: "3.5rem",
              fontWeight: 800,
              lineHeight: 1.15,
              margin: 0,
            }}
          >
            Health, cost,
            <br />
            and call volume.
          </h2>

          <div
            style={{
              width: 48,
              height: 3,
              backgroundColor: "#1e56cc",
              borderRadius: 2,
              margin: "24px 0 20px",
            }}
          />

          <p style={{ color: "#3d5068", fontSize: "1rem", lineHeight: 1.7, maxWidth: 360 }}>
            Isolated control plane. Different URL, different credentials,
            same single tenant.
          </p>

          <div style={{ marginTop: 32, display: "flex", flexWrap: "wrap", gap: 8 }}>
            {["Health Monitoring", "Cost Tracking", "Call Volume", "Control Plane"].map((tag) => (
              <span
                key={tag}
                style={{
                  border: "1.5px solid #1e56cc",
                  color: "#1e56cc",
                  borderRadius: 6,
                  padding: "6px 14px",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p style={{ color: "#8a9ab0", fontSize: "0.78rem" }}>
          Are you an operator?{" "}
          <Link
            href="/login"
            style={{
              color: "#1e56cc",
              fontWeight: 700,
              textDecoration: "underline",
              textUnderlineOffset: "3px",
              cursor: "pointer",
            }}
          >
            Click here to login
          </Link>
        </p>
      </section>

      {/* ── RIGHT  Navy Blue ── */}
      <section
        className="flex items-center justify-center p-8"
        style={{ backgroundColor: "#1e56cc" }}
      >
        <div
          className="w-full max-w-md"
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 10,
            padding: "40px",
            boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
          }}
        >
          {/* Mobile logo */}
          {/* <div
            className="lg:hidden"
            style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}
          >
            <img
              src="/logo.png"
              alt="Company logo"
              style={{ width: 40, height: 40, objectFit: "contain" }}
            />
            <span
              style={{
                color: "#0a1628",
                fontSize: "0.85rem",
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
              }}
            >
              Super Admin
            </span>
          </div> */}

          <LoginForm
            portal="admin"
            title="Super admin"
            subtitle="This page is not the operator login. Use control-plane credentials only."
            accent="amber"
          />
        </div>
      </section>

    </main>
  );
}