import { LoginForm } from "@/components/LoginForm";

export default function AdminLoginPage() {
  return (
    <main className="min-h-screen grid lg:grid-cols-2 bg-[#08070b]">
      <section className="hidden lg:flex flex-col justify-between p-12">
        <p className="tracking-[0.28em] uppercase text-sm text-[#f5b942]">Super admin</p>
        <div>
          <h2 className="text-5xl font-semibold leading-tight">Health, cost, and call volume.</h2>
          <p className="text-[var(--muted)] mt-4 max-w-md text-lg">
            Isolated control plane. Different URL, different credentials, same single tenant.
          </p>
        </div>
        <p className="text-sm text-[var(--muted)]">Operator workspace: /login</p>
      </section>
      <section className="flex items-center justify-center p-6">
        <LoginForm
          portal="admin"
          title="Super admin"
          subtitle="This page is not the operator login. Use control-plane credentials only."
          accent="amber"
        />
      </section>
    </main>
  );
}
