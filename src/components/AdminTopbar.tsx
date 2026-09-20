"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import {
  Bell, Search, ChevronDown, LogOut,
  Activity, DollarSign, Phone, X,
} from "lucide-react";

const NAVY = "#1e56cc";

const PAGE_TITLES: Record<string, { title: string; sub: string }> = {
  "/admin":        { title: "Super admin", sub: "Control plane" },
  "/admin/health": { title: "Health",      sub: "Status"        },
  "/admin/usage":  { title: "Cost usage",  sub: "OpenAI"        },
  "/admin/calls":  { title: "Calls",       sub: "Volume"        },
};

export function AdminTopbar({ name }: { name: string }) {
  const path   = usePathname();
  const router = useRouter();

  const page = Object.entries(PAGE_TITLES).find(
    ([k]) => path === k || path.startsWith(k + "/")
  )?.[1] ?? { title: "Admin", sub: "Control plane" };

  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen,   setNotifOpen]   = useState(false);
  const [searchVal,   setSearchVal]   = useState("");
  const [searchOpen,  setSearchOpen]  = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef   = useRef<HTMLDivElement>(null);
  const searchRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node))
        setProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node))
        setNotifOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target as Node))
        setSearchOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  /* Quick nav links for search */
  const QUICK_LINKS = [
    { label: "Overview",   sub: "Admin home",   href: "/admin",        icon: <Activity size={13} color={NAVY} /> },
    { label: "Health",     sub: "System status",href: "/admin/health", icon: <Activity size={13} color="#057a55" /> },
    { label: "Cost usage", sub: "OpenAI spend", href: "/admin/usage",  icon: <DollarSign size={13} color="#8e4b10" /> },
    { label: "Calls",      sub: "Call volume",  href: "/admin/calls",  icon: <Phone size={13} color="#6c2bd9" /> },
  ].filter(l => l.label.toLowerCase().includes(searchVal.toLowerCase()) ||
               l.sub.toLowerCase().includes(searchVal.toLowerCase()));

  return (
    <header style={{
      height: 64, flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 32px", backgroundColor: "#ffffff",
      borderBottom: "1.5px solid #e2e8f0",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      position: "sticky", top: 0, zIndex: 40,
    }}>

      {/* Left — page title */}
      <div>
        <p style={{ margin: 0, fontSize: "0.65rem", fontWeight: 700,
          textTransform: "uppercase", letterSpacing: "0.14em", color: "#6b7fa0" }}>
          {page.sub}
        </p>
        <p style={{ margin: 0, fontWeight: 700, fontSize: "1rem", color: NAVY, lineHeight: 1.2 }}>
          {page.title}
        </p>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>

        {/* Search */}
        <div ref={searchRef} style={{ position: "relative" }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%",
            transform: "translateY(-50%)", color: "#6b7fa0",
            pointerEvents: "none", zIndex: 1 }} />
          <input
            value={searchVal}
            onChange={(e) => { setSearchVal(e.target.value); setSearchOpen(true); }}
            placeholder="Search admin pages…"
            style={{
              width: 220, height: 36, padding: "0 32px",
              borderRadius: 8, border: "1.5px solid #e2e8f0",
              backgroundColor: "#f4f7ff", color: NAVY,
              fontSize: "0.82rem", outline: "none",
              fontFamily: "inherit", boxSizing: "border-box",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = NAVY;
              e.target.style.backgroundColor = "#fff";
              setSearchOpen(true);
            }}
            onBlur={(e) => {
              if (!searchVal) {
                e.target.style.borderColor = "#e2e8f0";
                e.target.style.backgroundColor = "#f4f7ff";
              }
            }}
          />
          {searchVal && (
            <button onClick={() => { setSearchVal(""); setSearchOpen(false); }}
              style={{ position: "absolute", right: 8, top: "50%",
                transform: "translateY(-50%)", background: "none",
                border: "none", cursor: "pointer", color: "#6b7fa0",
                display: "grid", placeItems: "center", padding: 0 }}>
              <X size={13} />
            </button>
          )}

          {searchOpen && searchVal && (
            <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0,
              width: 280, backgroundColor: "#ffffff", borderRadius: 10,
              border: "1.5px solid #e2e8f0",
              boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
              zIndex: 100, overflow: "hidden" }}>
              {QUICK_LINKS.length === 0 ? (
                <p style={{ padding: "14px 16px", margin: 0,
                  fontSize: "0.82rem", color: "#6b7fa0" }}>
                  No results for "{searchVal}"
                </p>
              ) : QUICK_LINKS.map((l, i) => (
                <div key={l.href}
                  onClick={() => { router.push(l.href); setSearchVal(""); setSearchOpen(false); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 16px", cursor: "pointer",
                    borderBottom: i < QUICK_LINKS.length - 1 ? "1px solid #f0f3f8" : "none",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8faff")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <div style={{ width: 28, height: 28, borderRadius: 6,
                    backgroundColor: "#f0f3f8", display: "grid",
                    placeItems: "center", flexShrink: 0 }}>
                    {l.icon}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: "0.82rem", color: NAVY }}>
                      {l.label}
                    </p>
                    <p style={{ margin: "1px 0 0", fontSize: "0.72rem", color: "#6b7fa0" }}>
                      {l.sub}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bell */}
        <div ref={notifRef} style={{ position: "relative" }}>
          <button onClick={() => setNotifOpen(o => !o)} style={{
            width: 36, height: 36, borderRadius: 8,
            border: "1.5px solid #e2e8f0", backgroundColor: "#f4f7ff",
            display: "grid", placeItems: "center", cursor: "pointer",
          }}>
            <Bell size={16} color="#6b7fa0" />
          </button>
          {notifOpen && (
            <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0,
              width: 280, backgroundColor: "#ffffff", borderRadius: 10,
              border: "1.5px solid #e2e8f0",
              boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
              zIndex: 100, padding: "20px 16px",
              textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: "0.82rem", color: "#6b7fa0" }}>
                No new notifications.
              </p>
            </div>
          )}
        </div>

        {/* Profile */}
        <div ref={profileRef} style={{ position: "relative" }}>
          <button onClick={() => setProfileOpen(o => !o)} style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "4px 10px 4px 4px", borderRadius: 8,
            border: "1.5px solid #e2e8f0", backgroundColor: "#f4f7ff",
            cursor: "pointer", height: 36,
          }}>
            <div style={{ width: 26, height: 26, borderRadius: 6,
              backgroundColor: NAVY, color: "#ffffff",
              display: "grid", placeItems: "center",
              fontWeight: 800, fontSize: "0.72rem", flexShrink: 0 }}>
              {name?.[0]?.toUpperCase() ?? "A"}
            </div>
            <span style={{ fontSize: "0.82rem", fontWeight: 600, color: NAVY,
              maxWidth: 100, overflow: "hidden",
              textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {name}
            </span>
            <ChevronDown size={13} color="#6b7fa0"
              style={{ transform: profileOpen ? "rotate(180deg)" : "none",
                transition: "transform 0.15s", flexShrink: 0 }} />
          </button>

          {profileOpen && (
            <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0,
              width: 200, backgroundColor: "#ffffff", borderRadius: 10,
              border: "1.5px solid #e2e8f0",
              boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
              zIndex: 100, overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid #f0f3f8" }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: "0.875rem", color: NAVY }}>
                  {name}
                </p>
                <p style={{ margin: "2px 0 0", fontSize: "0.72rem", color: "#6b7fa0" }}>
                  Super admin
                </p>
              </div>
              {[
                { label: "Overview",   href: "/admin"        },
                { label: "Health",     href: "/admin/health" },
                { label: "Cost usage", href: "/admin/usage"  },
                { label: "Calls",      href: "/admin/calls"  },
              ].map(({ label, href }) => (
                <a key={label} href={href}
                  onClick={(e) => { e.preventDefault(); router.push(href); setProfileOpen(false); }}
                  style={{ display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 16px", textDecoration: "none",
                    color: NAVY, fontSize: "0.82rem", fontWeight: 500 }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8faff")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  {label}
                </a>
              ))}
              <div style={{ borderTop: "1px solid #f0f3f8" }}>
                <button onClick={() => { setProfileOpen(false); logout(); }}
                  style={{ display: "flex", alignItems: "center", gap: 10,
                    width: "100%", padding: "10px 16px",
                    border: "none", backgroundColor: "transparent",
                    color: "#d93025", fontSize: "0.82rem", fontWeight: 600,
                    cursor: "pointer", textAlign: "left" }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#fce8f3")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <LogOut size={14} /> Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}