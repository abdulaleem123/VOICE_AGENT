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
            <p style={{
              color: NAVY, fontWeight: 700, fontSize: "0.8rem",
              margin: 0, letterSpacing: "0.03em", whiteSpace: "nowrap",
            }}>
              SUPER ADMIN
            </p>
            <p style={{ color: "#94a3b8", fontSize: "0.64rem", margin: 0 }}>
              Control plane
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

      {/* ── Nav ── */}
      <nav style={{
        flex: 1, overflowY: "auto",
        padding: "10px 8px",
        display: "flex", flexDirection: "column", gap: 0,
      }}>

        {/* Expand button — only when collapsed */}
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

        {/* Group label */}
        {!collapsed && (
          <p style={{
            margin: "0 0 4px 10px",
            fontSize: "0.61rem", fontWeight: 700,
            textTransform: "uppercase", letterSpacing: "0.08em",
            color: "#b0bdd0",
          }}>
            Control plane
          </p>
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
                style={{ flexShrink: 0, color: active ? NAVY : "#94a3b8" }}
              />
              {!collapsed && l.label}
            </Link>
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
                {name?.[0]?.toUpperCase() ?? "A"}
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
                  Super admin
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