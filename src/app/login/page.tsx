import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen grid lg:grid-cols-2">
      <section className="hidden lg:flex flex-col justify-between p-12">
        <p className="tracking-[0.28em] uppercase text-sm text-[var(--accent)]">Voice Agent</p>
        <div>
          <h2 className="text-5xl font-semibold leading-tight">Talk, qualify, hand off, book.</h2>
          <p className="text-[var(--muted)] mt-4 max-w-md text-lg">
            Single-tenant operator console for inbound and outbound conversations powered by your OpenAI key.
          </p>
        </div>
        <p className="text-sm text-[var(--muted)]">Super admin lives on a separate URL: /admin/login</p>
      </section>
      <section className="flex items-center justify-center p-6">
        <LoginForm
          portal="user"
          title="Operator login"
          subtitle="Sign in to configure the agent, knowledge base, leads, and meetings."
          accent="cyan"
        />
      </section>
    </main>
  );
}
