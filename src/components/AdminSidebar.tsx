"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Activity, ChevronLeft, ChevronRight,
  DollarSign, LayoutDashboard, LogOut, Phone,
} from "lucide-react";

const NAVY = "#1e56cc";

const links = [
  { href: "/admin",        label: "Overview",   icon: LayoutDashboard },
  { href: "/admin/health", label: "Health",     icon: Activity        },
  { href: "/admin/usage",  label: "Cost usage", icon: DollarSign      },
  { href: "/admin/calls",  label: "Calls",      icon: Phone           },
];

export function AdminSidebar({ name }: { name: string }) {
  const path   = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <aside style={{
      width: collapsed ? 64 : 240, minWidth: collapsed ? 64 : 240,
      height: "100vh", position: "sticky", top: 0,
      backgroundColor: "#ffffff", display: "flex", flexDirection: "column",
      transition: "width 0.22s ease, min-width 0.22s ease",
      overflow: "hidden", borderRight: "1.5px solid #e2e8f0",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      ["--bg"    as string]: "#ffffff",
      ["--bg-2"  as string]: "#ffffff",
      ["--card"  as string]: "#ffffff",
      ["--line"  as string]: "#e2e8f0",
      ["--text"  as string]: NAVY,
      ["--muted" as string]: "#6b7fa0",
    }}>

      {/* ── Logo row — logo always stays here ── */}
      <div style={{
        height: 64, flexShrink: 0,
        display: "flex", alignItems: "center",
        padding: "0 12px",
        borderBottom: "1.5px solid #e2e8f0",
        justifyContent: collapsed ? "center" : "space-between",
      }}>
        {/* Brand / Logo — always visible */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          overflow: "hidden", flex: collapsed ? "none" : 1, minWidth: 0,
        }}>
          <img
            src="/logo.png"
            alt="Logo"
            style={{ width: 36, height: 36, objectFit: "contain", flexShrink: 0 }}
          />
          {!collapsed && (
            <div style={{ overflow: "hidden" }}>
              <p style={{
                color: NAVY, fontWeight: 700, fontSize: "0.82rem",
                whiteSpace: "nowrap", margin: 0, letterSpacing: "0.04em",
              }}>
                SUPER ADMIN
              </p>
              <p style={{ color: "#6b7fa0", fontSize: "0.68rem", margin: 0 }}>
                Control plane
              </p>
            </div>
          )}
        </div>

        {/* Chevron only when expanded (on the logo row) */}
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            style={{
              width: 28, height: 28,
              background: "#f0f3fa", border: "1.5px solid #e2e8f0", borderRadius: 6,
              color: "#6b7fa0", cursor: "pointer",
              display: "grid", placeItems: "center", flexShrink: 0,
            }}
          >
            <ChevronLeft size={14} />
          </button>
        )}
      </div>

      {/* ── Nav links ── */}
      <nav style={{
        flex: 1, padding: "10px 8px",
        display: "flex", flexDirection: "column", gap: 2, overflowY: "auto",
      }}>
        {/* Chevron on the NEXT LINE when collapsed (before page icons) */}
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            title="Expand sidebar"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: "100%", height: 36, marginBottom: 4,
              background: "#f0f3fa", border: "1.5px solid #e2e8f0", borderRadius: 8,
              color: "#6b7fa0", cursor: "pointer",
            }}
          >
            <ChevronRight size={16} />
          </button>
        )}

        {links.map((l) => {
          const active = path === l.href ||
            (l.href !== "/admin" && path.startsWith(l.href));
          const Icon = l.icon;
          return (
            <Link
              key={l.href}
              href={l.href}
              title={collapsed ? l.label : undefined}
              style={{
                display: "flex", alignItems: "center",
                justifyContent: collapsed ? "center" : "flex-start",
                gap: collapsed ? 0 : 10,
                padding: collapsed ? "10px 0" : "9px 12px",
                borderRadius: 8, textDecoration: "none",
                fontSize: "0.855rem", fontWeight: active ? 600 : 400,
                color: active ? "#ffffff" : "#4a6080",
                backgroundColor: active ? NAVY : "transparent",
                borderLeft: active && !collapsed ? `3px solid ${NAVY}` : "3px solid transparent",
                transition: "background 0.15s, color 0.15s", whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "#eef2fb";
                  (e.currentTarget as HTMLAnchorElement).style.color = NAVY;
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "transparent";
                  (e.currentTarget as HTMLAnchorElement).style.color = "#4a6080";
                }
              }}
            >
              <Icon size={17} style={{ flexShrink: 0 }} />
              {!collapsed && l.label}
            </Link>
          );
        })}
      </nav>

      {/* ── Footer ── */}
      <div style={{ borderTop: "1.5px solid #e2e8f0", padding: "12px 8px" }}>
        {collapsed ? (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <button
              onClick={logout}
              title="Sign out"
              style={{
                width: 36, height: 36, borderRadius: 8,
                backgroundColor: "#f4f7ff", border: "1.5px solid #e2e8f0",
                color: "#6b7fa0", cursor: "pointer",
                display: "grid", placeItems: "center",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = "#d93025";
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#fce8f3";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#f8b4d9";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = "#6b7fa0";
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#f4f7ff";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#e2e8f0";
              }}
            >
              <LogOut size={15} />
            </button>
          </div>
        ) : (
          <div style={{
            backgroundColor: "#f4f7ff", border: "1.5px solid #e2e8f0",
            borderRadius: 10, padding: "10px 12px",
            display: "flex", alignItems: "center",
            justifyContent: "space-between", gap: 8,
          }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 9,
              overflow: "hidden", minWidth: 0,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                backgroundColor: NAVY, color: "#ffffff",
                display: "grid", placeItems: "center",
                fontWeight: 800, fontSize: "0.78rem",
              }}>
                {name?.[0]?.toUpperCase() ?? "A"}
              </div>
              <div style={{ overflow: "hidden", minWidth: 0 }}>
                <p style={{
                  color: NAVY, fontWeight: 600, fontSize: "0.8rem",
                  margin: 0, whiteSpace: "nowrap", overflow: "hidden",
                  textOverflow: "ellipsis",
                }}>
                  {name}
                </p>
                <p style={{ color: "#6b7fa0", fontSize: "0.66rem", margin: 0 }}>
                  Super admin
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign out"
              style={{
                background: "transparent", border: "none", color: "#6b7fa0",
                cursor: "pointer", padding: 6, borderRadius: 6,
                display: "grid", placeItems: "center", flexShrink: 0,
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#d93025")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#6b7fa0")}
            >
              <LogOut size={15} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}