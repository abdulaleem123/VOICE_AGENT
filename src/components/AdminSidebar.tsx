"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Activity, PhoneCall, Shield, Wallet } from "lucide-react";

const links = [
  { href: "/admin", label: "Overview", icon: Shield },
  { href: "/admin/health", label: "Health", icon: Activity },
  { href: "/admin/usage", label: "Cost usage", icon: Wallet },
  { href: "/admin/calls", label: "Calls", icon: PhoneCall },
];

export function AdminSidebar({ name }: { name: string }) {
  const path = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <aside className="w-[250px] shrink-0 h-screen sticky top-0 p-4 flex flex-col">
      <div className="px-3 py-4">
        <p className="text-xs tracking-[0.2em] uppercase text-[#f5b942]">Super admin</p>
        <p className="font-semibold mt-1">Control plane</p>
      </div>
      <nav className="mt-2 space-y-1 flex-1">
        {links.map((l) => {
          const active = l.href === "/admin" ? path === "/admin" : path.startsWith(l.href);
          const Icon = l.icon;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm ${
                active ? "bg-[#f5b942]/12 text-[#f5b942]" : "text-[var(--muted)] hover:bg-white/4 hover:text-white"
              }`}
            >
              <Icon size={16} />
              {l.label}
            </Link>
          );
        })}
      </nav>
      <div className="glass rounded-2xl p-3">
        <p className="text-sm font-medium truncate">{name}</p>
        <button onClick={logout} className="text-xs text-[var(--muted)] hover:text-white mt-2">
          Sign out
        </button>
      </div>
    </aside>
  );
}
