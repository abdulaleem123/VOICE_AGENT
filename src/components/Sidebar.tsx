"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  AudioLines,
  BookOpen,
  Building2,
  Calendar,
  Handshake,
  LayoutDashboard,
  MessageSquare,
  PhoneCall,
  Plug,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";
import { TenantSwitcher } from "@/components/TenantSwitcher";

const links = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/tenants", label: "Tenants", icon: Building2 },
  { href: "/agent", label: "Agent", icon: Sparkles },
  { href: "/knowledge", label: "Knowledge", icon: BookOpen },
  { href: "/conversations", label: "Conversation", icon: MessageSquare },
  { href: "/calls", label: "Calls", icon: PhoneCall },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/handoff", label: "Handoff", icon: Handshake },
  { href: "/meetings", label: "Meeting", icon: Calendar },
  { href: "/integrations", label: "Integrations", icon: Plug },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ name }: { name: string }) {
  const path = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="w-[250px] shrink-0 h-screen sticky top-0 p-4 flex flex-col">
      <div className="px-3 py-4 flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-[#2ee6c8] text-[#06211c] grid place-items-center">
          <AudioLines size={18} />
        </div>
        <div>
          <p className="font-semibold leading-tight">Voice Agent</p>
          <p className="text-xs text-[var(--muted)]">Multi-tenant</p>
        </div>
      </div>
      <TenantSwitcher compact />
      <nav className="mt-4 space-y-1 flex-1">
        {links.map((l) => {
          const active = path === l.href || path.startsWith(l.href + "/");
          const Icon = l.icon;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm ${
                active ? "bg-white/8 text-white" : "text-[var(--muted)] hover:bg-white/4 hover:text-white"
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
        <p className="text-xs text-[var(--muted)] mb-3">Operator</p>
        <button onClick={logout} className="text-xs text-[var(--muted)] hover:text-white">
          Sign out
        </button>
      </div>
    </aside>
  );
}
