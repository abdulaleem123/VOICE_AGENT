"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  BookOpen, Building2, Calendar, ChevronLeft, ChevronRight,
  Handshake, LayoutDashboard, LogOut, MessageSquare,
  PhoneCall, Plug, Settings, Sparkles, Users,
} from "lucide-react";
import { TenantSwitcher } from "@/components/TenantSwitcher";

const NAVY = "#1e56cc";

const links = [
  { href: "/dashboard",     label: "Overview",     icon: LayoutDashboard, group: "main"  },
  { href: "/tenants",       label: "Tenants",      icon: Building2,       group: "main"  },
  { href: "/agent",         label: "Agent",        icon: Sparkles,        group: "main"  },
  { href: "/knowledge",     label: "Knowledge",    icon: BookOpen,        group: "main"  },
  { href: "/conversations", label: "Conversation", icon: MessageSquare,   group: "comms" },
  { href: "/calls",         label: "Calls",        icon: PhoneCall,       group: "comms" },
  { href: "/leads",         label: "Leads",        icon: Users,           group: "comms" },
  { href: "/handoff",       label: "Handoff",      icon: Handshake,       group: "comms" },
  { href: "/meetings",      label: "Meeting",      icon: Calendar,        group: "comms" },
  { href: "/integrations",  label: "Integrations", icon: Plug,            group: "sys"   },
  { href: "/settings",      label: "Settings",     icon: Settings,        group: "sys"   },
];

const groups = [
  { key: "main",  label: "Workspace" },
  { key: "comms", label: "Comms"     },
  { key: "sys",   label: "System"    },
];

export function Sidebar({ name }: { name: string }) {
  const path   = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside style={{
      width: collapsed ? 68 : 248,
      minWidth: collapsed ? 68 : 248,
      height: "100vh",
      position: "sticky",
      top: 0,
      backgroundColor: "#f8faff",
      display: "flex",
      flexDirection: "column",
      transition: "width 0.2s ease, min-width 0.2s ease",
      overflow: "hidden",
      borderRight: "1px solid #e4eaf6",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      ["--bg"    as string]: "#f8faff",
      ["--card"  as string]: "#ffffff",
      ["--line"  as string]: "#e4eaf6",
      ["--text"  as string]: NAVY,
      ["--muted" as string]: "#6b7fa0",
      ["--accent"as string]: NAVY,
    }}>

      {/* ── Header ── */}
      <div style={{
        height: 60, flexShrink: 0,
        display: "flex", alignItems: "center",
        padding: "0 14px",
        borderBottom: "1px solid #e4eaf6",
        backgroundColor: "#ffffff",
        justifyContent: collapsed ? "center" : "space-between",
      }}>
        {/* Logo — plain, no border, no box */}
        <img
          src="/logo.png"
          alt="Logo"
          style={{
            width: 34, height: 34,
            objectFit: "contain",
            flexShrink: 0,
            display: "block",
          }}
        />

        {/* Brand text */}
        {!collapsed && (
          <div style={{ flex: 1, minWidth: 0, overflow: "hidden", marginLeft: 10 }}>
            <p style={{ color: NAVY, fontWeight: 700, fontSize: "0.85rem",
              margin: 0, whiteSpace: "nowrap", overflow: "hidden",
              textOverflow: "ellipsis" }}>
              Voice Agent
            </p>
            <p style={{ color: "#94a3b8", fontSize: "0.65rem", margin: 0 }}>
              Multi-tenant
            </p>
          </div>
        )}

        {/* Collapse button — only when expanded */}
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            style={{
              width: 24, height: 24, borderRadius: 6, flexShrink: 0,
              background: "#f0f4ff", border: "1px solid #e4eaf6",
              color: "#94a3b8", cursor: "pointer",
              display: "grid", placeItems: "center", marginLeft: 6,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#e4ecff";
              (e.currentTarget as HTMLButtonElement).style.color = NAVY;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#f0f4ff";
              (e.currentTarget as HTMLButtonElement).style.color = "#94a3b8";
            }}
          >
            <ChevronLeft size={13} />
          </button>
        )}
      </div>

      {/* ── Tenant switcher ── */}
      {!collapsed && (
        <div style={{
          padding: "10px 12px",
          backgroundColor: "#ffffff",
          borderBottom: "1px solid #e4eaf6",
        }}>
          <TenantSwitcher compact />
        </div>
      )}

      {/* ── Nav ── */}
      <nav style={{
        flex: 1, overflowY: "auto",
        padding: "10px 8px",
        display: "flex", flexDirection: "column", gap: 0,
      }}>

        {/* Expand button — only when collapsed, cleanly at top of nav */}
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            title="Expand sidebar"
            style={{
              width: "100%", height: 30, borderRadius: 7,
              marginBottom: 8,
              background: "#f0f4ff", border: "1px solid #e4eaf6",
              color: "#94a3b8", cursor: "pointer",
              display: "grid", placeItems: "center", flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#e4ecff";
              (e.currentTarget as HTMLButtonElement).style.color = NAVY;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#f0f4ff";
              (e.currentTarget as HTMLButtonElement).style.color = "#94a3b8";
            }}
          >
            <ChevronRight size={14} />
          </button>
        )}

        {groups.map((g, gi) => {
          const groupLinks = links.filter(l => l.group === g.key);
          return (
            <div key={g.key} style={{ marginBottom: gi < groups.length - 1 ? 14 : 0 }}>

              {/* Group label */}
              {!collapsed && (
                <p style={{
                  margin: "0 0 3px 10px",
                  fontSize: "0.61rem", fontWeight: 700,
                  textTransform: "uppercase", letterSpacing: "0.08em",
                  color: "#b0bdd0",
                }}>
                  {g.label}
                </p>
              )}

              {/* Divider between groups when collapsed */}
              {collapsed && gi > 0 && (
                <div style={{
                  height: 1, backgroundColor: "#e4eaf6",
                  margin: "6px 8px 8px",
                }} />
              )}

              {groupLinks.map((l) => {
                const active = path === l.href || path.startsWith(l.href + "/");
                const Icon   = l.icon;
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    title={collapsed ? l.label : undefined}
                    style={{
                      display: "flex", alignItems: "center",
                      justifyContent: collapsed ? "center" : "flex-start",
                      gap: 9,
                      padding: collapsed ? "9px 0" : "8px 10px",
                      borderRadius: 8, textDecoration: "none",
                      fontSize: "0.84rem",
                      fontWeight: active ? 600 : 400,
                      color: active ? NAVY : "#64748b",
                      backgroundColor: active ? "#e8efff" : "transparent",
                      marginBottom: 1,
                      position: "relative",
                      transition: "background 0.12s, color 0.12s",
                    }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "#f0f4ff";
                        (e.currentTarget as HTMLAnchorElement).style.color = NAVY;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "transparent";
                        (e.currentTarget as HTMLAnchorElement).style.color = "#64748b";
                      }
                    }}
                  >
                    {/* Active left bar */}
                    {active && !collapsed && (
                      <span style={{
                        position: "absolute", left: 0,
                        top: "20%", bottom: "20%",
                        width: 3, borderRadius: "0 3px 3px 0",
                        backgroundColor: NAVY,
                      }} />
                    )}
                    <Icon
                      size={16}
                      style={{
                        flexShrink: 0,
                        color: active ? NAVY : "#94a3b8",
                      }}
                    />
                    {!collapsed && l.label}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* ── Footer ── */}
      <div style={{
        borderTop: "1px solid #e4eaf6",
        padding: "10px 8px",
        backgroundColor: "#ffffff",
      }}>
        {collapsed ? (
          /* Collapsed — logout icon only */
          <div style={{ display: "flex", justifyContent: "center" }}>
            <button
              onClick={logout}
              title="Sign out"
              style={{
                width: 36, height: 36, borderRadius: 8,
                backgroundColor: "#f8faff", border: "1px solid #e4eaf6",
                color: "#94a3b8", cursor: "pointer",
                display: "grid", placeItems: "center",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.color = "#ef4444";
                el.style.backgroundColor = "#fef2f2";
                el.style.borderColor = "#fecaca";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.color = "#94a3b8";
                el.style.backgroundColor = "#f8faff";
                el.style.borderColor = "#e4eaf6";
              }}
            >
              <LogOut size={15} />
            </button>
          </div>
        ) : (
          /* Expanded — user card */
          <div style={{
            display: "flex", alignItems: "center",
            justifyContent: "space-between", gap: 8,
            padding: "8px 10px", borderRadius: 10,
            backgroundColor: "#f0f4ff", border: "1px solid #e4eaf6",
          }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 9,
              overflow: "hidden", minWidth: 0,
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                background: `linear-gradient(135deg, ${NAVY} 0%, #4f7ef8 100%)`,
                color: "#ffffff", display: "grid", placeItems: "center",
                fontWeight: 700, fontSize: "0.78rem",
              }}>
                {name?.[0]?.toUpperCase() ?? "O"}
              </div>
              <div style={{ minWidth: 0, overflow: "hidden" }}>
                <p style={{
                  color: "#1e293b", fontWeight: 600, fontSize: "0.8rem",
                  margin: 0, whiteSpace: "nowrap",
                  overflow: "hidden", textOverflow: "ellipsis",
                }}>
                  {name}
                </p>
                <p style={{ color: "#94a3b8", fontSize: "0.65rem", margin: 0 }}>
                  Operator
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign out"
              style={{
                background: "transparent", border: "none",
                color: "#94a3b8", cursor: "pointer",
                padding: 5, borderRadius: 6,
                display: "grid", placeItems: "center", flexShrink: 0,
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#ef4444")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#94a3b8")}
            >
              <LogOut size={14} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}