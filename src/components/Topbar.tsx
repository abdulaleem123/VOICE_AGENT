"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  Bell, Search, ChevronDown, User,
  Settings, LogOut, HelpCircle, X,
  Users, MessageSquare, Handshake, Calendar,
} from "lucide-react";

const NAVY = "#1e56cc";

const PAGE_TITLES: Record<string, { title: string; sub: string }> = {
  "/dashboard":     { title: "Overview",      sub: "Workspace"    },
  "/tenants":       { title: "Tenants",        sub: "Multi-tenant" },
  "/agent":         { title: "Agent",          sub: "Configuration"},
  "/knowledge":     { title: "Knowledge base", sub: "Grounding"    },
  "/conversations": { title: "Conversations",  sub: "Live"         },
  "/calls":         { title: "Calls",          sub: "Telephony"    },
  "/leads":         { title: "Leads",          sub: "Pipeline"     },
  "/handoff":       { title: "Handoff",        sub: "Queue"        },
  "/meetings":      { title: "Meetings",       sub: "Calendar"     },
  "/integrations":  { title: "Integrations",   sub: "Third-party"  },
  "/settings":      { title: "Settings",       sub: "Workspace"    },
};

type Notif = {
  id: string;
  text: string;
  time: string;
  dot: string;
  href: string;
  icon: React.ReactNode;
};

type SearchResult = {
  id: string;
  type: "lead" | "conversation" | "meeting";
  label: string;
  sub: string;
  href: string;
};

export function Topbar({ name }: { name: string }) {
  const path   = usePathname();
  const router = useRouter();

  const page = Object.entries(PAGE_TITLES).find(
    ([k]) => path === k || path.startsWith(k + "/")
  )?.[1] ?? { title: "Dashboard", sub: "Workspace" };

  const [notifOpen,   setNotifOpen]   = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchVal,   setSearchVal]   = useState("");
  const [searchOpen,  setSearchOpen]  = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching,   setSearching]   = useState(false);
  const [notifs,      setNotifs]      = useState<Notif[]>([]);
  const [unread,      setUnread]      = useState(0);
  const [notifsLoaded, setNotifsLoaded] = useState(false);

  const notifRef   = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef  = useRef<HTMLDivElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Close dropdowns on outside click ── */
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (notifRef.current   && !notifRef.current.contains(e.target as Node))   setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
      if (searchRef.current  && !searchRef.current.contains(e.target as Node))  setSearchOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ── Load real notifications from APIs ── */
  const loadNotifs = useCallback(async () => {
    if (notifsLoaded) return;
    try {
      const [leadsRes, convsRes, handoffsRes, meetingsRes] = await Promise.all([
        fetch("/api/leads").then(r => r.json()).catch(() => ({ items: [] })),
        fetch("/api/conversations").then(r => r.json()).catch(() => ({ items: [] })),
        fetch("/api/handoffs").then(r => r.json()).catch(() => ({ items: [] })),
        fetch("/api/meetings").then(r => r.json()).catch(() => ({ items: [] })),
      ]);

      const items: Notif[] = [];

      /* Recent leads */
      const leads = (leadsRes.items || []).slice(0, 2);
      leads.forEach((l: any) => {
        items.push({
          id: `lead-${l.id}`,
          text: `New lead: ${l.name || "Unknown"} ${l.company ? `· ${l.company}` : ""}`.trim(),
          time: timeAgo(l.createdAt),
          dot: NAVY,
          href: "/leads",
          icon: <Users size={13} />,
        });
      });

      /* Pending handoffs */
      const handoffs = (handoffsRes.items || []).filter((h: any) => h.status === "pending").slice(0, 2);
      handoffs.forEach((h: any) => {
        items.push({
          id: `handoff-${h.id}`,
          text: `Handoff pending: ${h.reason || "Agent requested handoff"}`,
          time: timeAgo(h.createdAt),
          dot: "#f97316",
          href: "/handoff",
          icon: <Handshake size={13} />,
        });
      });

      /* Upcoming meetings */
      const meetings = (meetingsRes.items || []).filter((m: any) => m.status === "scheduled").slice(0, 2);
      meetings.forEach((m: any) => {
        items.push({
          id: `meeting-${m.id}`,
          text: `Meeting scheduled: ${m.title}`,
          time: timeAgo(m.createdAt),
          dot: "#10b981",
          href: "/meetings",
          icon: <Calendar size={13} />,
        });
      });

      /* Recent conversations */
      const convs = (convsRes.items || []).filter((c: any) => c.status === "active").slice(0, 1);
      convs.forEach((c: any) => {
        items.push({
          id: `conv-${c.id}`,
          text: `Active conversation: ${c.lead?.name || "Unknown visitor"}`,
          time: timeAgo(c.updatedAt),
          dot: "#6b7fa0",
          href: `/conversations/${c.id}`,
          icon: <MessageSquare size={13} />,
        });
      });

      setNotifs(items);
      setUnread(items.length);
      setNotifsLoaded(true);
    } catch {
      setNotifs([]);
    }
  }, [notifsLoaded]);

  /* ── Real search across leads + conversations + meetings ── */
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!searchVal.trim()) { setSearchResults([]); setSearchOpen(false); return; }

    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const q = searchVal.toLowerCase();
        const [leadsRes, convsRes, meetingsRes] = await Promise.all([
          fetch("/api/leads").then(r => r.json()).catch(() => ({ items: [] })),
          fetch("/api/conversations").then(r => r.json()).catch(() => ({ items: [] })),
          fetch("/api/meetings").then(r => r.json()).catch(() => ({ items: [] })),
        ]);

        const results: SearchResult[] = [];

        /* Leads */
        (leadsRes.items || []).forEach((l: any) => {
          const hay = `${l.name} ${l.company} ${l.email} ${l.persona}`.toLowerCase();
          if (hay.includes(q)) results.push({
            id: `lead-${l.id}`, type: "lead",
            label: l.name || "Unknown lead",
            sub: l.company || l.email || "Lead",
            href: "/leads",
          });
        });

        /* Conversations */
        (convsRes.items || []).forEach((c: any) => {
          const hay = `${c.lead?.name} ${c.lead?.company} ${c.channel} ${c.status}`.toLowerCase();
          if (hay.includes(q)) results.push({
            id: `conv-${c.id}`, type: "conversation",
            label: c.lead?.name || "Unknown visitor",
            sub: `${c.channel} · ${c.status}`,
            href: `/conversations/${c.id}`,
          });
        });

        /* Meetings */
        (meetingsRes.items || []).forEach((m: any) => {
          const hay = `${m.title} ${m.reason} ${m.lead?.name}`.toLowerCase();
          if (hay.includes(q)) results.push({
            id: `meeting-${m.id}`, type: "meeting",
            label: m.title,
            sub: new Date(m.scheduledAt).toLocaleString(),
            href: "/meetings",
          });
        });

        setSearchResults(results.slice(0, 8));
        setSearchOpen(results.length > 0);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  }, [searchVal]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const TYPE_ICON: Record<string, React.ReactNode> = {
    lead:         <Users size={13} color={NAVY} />,
    conversation: <MessageSquare size={13} color="#10b981" />,
    meeting:      <Calendar size={13} color="#f97316" />,
  };

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

      {/* Right */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>

        {/* ── Search ── */}
        <div ref={searchRef} style={{ position: "relative" }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%",
            transform: "translateY(-50%)", color: "#6b7fa0", pointerEvents: "none", zIndex: 1 }} />
          <input
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="Search leads, conversations…"
            style={{
              width: 240, height: 36, padding: "0 32px 0 32px",
              borderRadius: 8, border: "1.5px solid #e2e8f0",
              backgroundColor: "#f4f7ff", color: NAVY,
              fontSize: "0.82rem", outline: "none", fontFamily: "inherit",
              boxSizing: "border-box",
            }}
            onFocus={(e) => {
                e.target.style.borderColor = NAVY;
                e.target.style.backgroundColor = "#fff";
                if (searchVal.trim()) setSearchOpen(true);
            }}
            onBlur={(e)  => { if (!searchVal) { e.target.style.borderColor = "#e2e8f0"; e.target.style.backgroundColor = "#f4f7ff"; }}}
          />
          {searchVal && (
            <button onClick={() => { setSearchVal(""); setSearchResults([]); setSearchOpen(false); }}
              style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer", color: "#6b7fa0",
                display: "grid", placeItems: "center", padding: 0 }}>
              <X size={13} />
            </button>
          )}

          {/* Search results dropdown */}
          {searchOpen && (
            <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0,
              width: 320, backgroundColor: "#ffffff", borderRadius: 10,
              border: "1.5px solid #e2e8f0", boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
              zIndex: 100, overflow: "hidden" }}>
              {searching ? (
                <p style={{ padding: "14px 16px", margin: 0, fontSize: "0.82rem", color: "#6b7fa0" }}>
                  Searching…
                </p>
              ) : searchResults.length === 0 ? (
                <p style={{ padding: "14px 16px", margin: 0, fontSize: "0.82rem", color: "#6b7fa0" }}>
                  No results for "{searchVal}"
                </p>
              ) : searchResults.map((r, i) => (
                <div key={r.id}
                  onClick={() => { router.push(r.href); setSearchVal(""); setSearchOpen(false); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "10px 16px",
                    borderBottom: i < searchResults.length - 1 ? "1px solid #f0f3f8" : "none",
                    cursor: "pointer", transition: "background 0.12s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8faff")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <div style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0,
                    backgroundColor: "#f0f3f8", display: "grid", placeItems: "center" }}>
                    {TYPE_ICON[r.type]}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: "0.82rem", color: NAVY,
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {r.label}
                    </p>
                    <p style={{ margin: "1px 0 0", fontSize: "0.72rem", color: "#6b7fa0",
                      textTransform: "capitalize" }}>
                      {r.type} · {r.sub}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Notification bell ── */}
        <div ref={notifRef} style={{ position: "relative" }}>
          <button
            onClick={() => {
              setNotifOpen((o) => !o);
              setUnread(0);
              loadNotifs();
            }}
            style={{
              width: 36, height: 36, borderRadius: 8,
              border: "1.5px solid #e2e8f0", backgroundColor: "#f4f7ff",
              display: "grid", placeItems: "center", cursor: "pointer",
              position: "relative",
            }}
          >
            <Bell size={16} color="#6b7fa0" />
            {unread > 0 && (
              <span style={{ position: "absolute", top: 6, right: 6,
                width: 8, height: 8, borderRadius: "50%",
                backgroundColor: "#d93025", border: "2px solid #ffffff" }} />
            )}
          </button>

          {notifOpen && (
            <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0,
              width: 340, backgroundColor: "#ffffff", borderRadius: 10,
              border: "1.5px solid #e2e8f0", boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
              zIndex: 100, overflow: "hidden" }}>
              <div style={{ padding: "14px 16px", borderBottom: "1px solid #f0f3f8",
                display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: "0.875rem", color: NAVY }}>
                  Notifications
                </p>
                <span style={{ fontSize: "0.72rem", color: "#6b7fa0" }}>
                  {notifs.length} items
                </span>
              </div>

              {notifs.length === 0 ? (
                <p style={{ padding: "20px 16px", margin: 0, textAlign: "center",
                  fontSize: "0.82rem", color: "#6b7fa0" }}>
                  No notifications yet.
                </p>
              ) : notifs.map((n, i) => (
                <div key={n.id}
                  onClick={() => { router.push(n.href); setNotifOpen(false); }}
                  style={{ padding: "12px 16px",
                    borderBottom: i < notifs.length - 1 ? "1px solid #f0f3f8" : "none",
                    display: "flex", gap: 10, alignItems: "flex-start",
                    cursor: "pointer", transition: "background 0.12s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8faff")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <div style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0,
                    backgroundColor: "#f0f3f8", display: "grid", placeItems: "center",
                    color: n.dot }}>
                    {n.icon}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ margin: 0, fontSize: "0.82rem", color: NAVY,
                      lineHeight: 1.4, fontWeight: 500 }}>{n.text}</p>
                    <p style={{ margin: "3px 0 0", fontSize: "0.72rem", color: "#6b7fa0" }}>
                      {n.time}
                    </p>
                  </div>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", marginTop: 6,
                    backgroundColor: n.dot, flexShrink: 0 }} />
                </div>
              ))}

              <div style={{ padding: "10px 16px", borderTop: "1px solid #f0f3f8", textAlign: "center" }}>
                <span onClick={() => { router.push("/dashboard"); setNotifOpen(false); }}
                  style={{ fontSize: "0.78rem", color: NAVY, fontWeight: 600, cursor: "pointer" }}>
                  View activity →
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ── Profile dropdown ── */}
        <div ref={profileRef} style={{ position: "relative" }}>
          <button onClick={() => setProfileOpen((o) => !o)} style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "4px 10px 4px 4px", borderRadius: 8,
            border: "1.5px solid #e2e8f0", backgroundColor: "#f4f7ff",
            cursor: "pointer", height: 36,
          }}>
            <div style={{ width: 26, height: 26, borderRadius: 6, backgroundColor: NAVY,
              color: "#ffffff", display: "grid", placeItems: "center",
              fontWeight: 800, fontSize: "0.72rem", flexShrink: 0 }}>
              {name?.[0]?.toUpperCase() ?? "O"}
            </div>
            <span style={{ fontSize: "0.82rem", fontWeight: 600, color: NAVY,
              maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {name}
            </span>
            <ChevronDown size={13} color="#6b7fa0"
              style={{ transform: profileOpen ? "rotate(180deg)" : "none",
                transition: "transform 0.15s", flexShrink: 0 }} />
          </button>

          {profileOpen && (
            <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0,
              width: 210, backgroundColor: "#ffffff", borderRadius: 10,
              border: "1.5px solid #e2e8f0", boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
              zIndex: 100, overflow: "hidden" }}>

              {/* User info */}
              <div style={{ padding: "12px 16px", borderBottom: "1px solid #f0f3f8" }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: "0.875rem", color: NAVY }}>{name}</p>
                <p style={{ margin: "2px 0 0", fontSize: "0.72rem", color: "#6b7fa0" }}>Operator</p>
              </div>

              {/* Nav items — only non-external, non-duplicate links */}
              {([
                { icon: <User size={14} />,         label: "My profile",    href: "/settings" },
                { icon: <MessageSquare size={14} />, label: "Conversations", href: "/conversations" },
              ] as const).map(({ icon, label, href }) => (
                <a key={label}
                  href={href}
                  onClick={(e) => {
                    e.preventDefault();
                    router.push(href);
                    setProfileOpen(false);
                  }}
                  style={{ display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 16px", textDecoration: "none",
                    color: NAVY, fontSize: "0.82rem", fontWeight: 500 }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8faff")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <span style={{ color: "#6b7fa0" }}>{icon}</span>
                  {label}
                </a>
              ))}

              <div style={{ borderTop: "1px solid #f0f3f8" }}>
                <button onClick={() => { setProfileOpen(false); logout(); }}
                  style={{ display: "flex", alignItems: "center", gap: 10, width: "100%",
                    padding: "10px 16px", border: "none", backgroundColor: "transparent",
                    color: "#d93025", fontSize: "0.82rem", fontWeight: 600,
                    cursor: "pointer", textAlign: "left", transition: "background 0.12s" }}
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

/* ── Helper: human-readable time ago ── */
function timeAgo(dateStr: string): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return "just now";
  if (mins  < 60) return `${mins} min ago`;
  if (hours < 24) return `${hours} hr ago`;
  return `${days}d ago`;
}