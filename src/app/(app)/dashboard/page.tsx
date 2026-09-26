"use client";

import { useEffect, useState } from "react";
import { usdShort } from "@/lib/costs";
import Link from "next/link";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler,
  RadialLinearScale,
} from "chart.js";
import { Doughnut, Bar, Line, PolarArea } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler,
  RadialLinearScale
);

const NAVY = "#0a1628";
const ACCENT = "#1e56cc";

const ANIM_STYLES = `
  @keyframes pageFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes riseIn {
    from { opacity: 0; transform: translateY(18px) scale(0.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes popIn {
    0% { opacity: 0; transform: scale(0.85); }
    70% { opacity: 1; transform: scale(1.03); }
    100% { transform: scale(1); }
  }
  @keyframes rowIn {
    from { opacity: 0; transform: translateX(-8px); }
    to { opacity: 1; transform: translateX(0); }
  }
  .page-in { animation: pageFadeIn 0.4s ease both; }
  .rise-in { animation: riseIn 0.55s cubic-bezier(0.22, 1, 0.36, 1) both; }
  .pop-in { animation: popIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) both; }
  .row-in { animation: rowIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) both; }
  .card-hover { transition: transform 0.18s ease, box-shadow 0.18s ease; }
  .card-hover:hover { transform: translateY(-3px); box-shadow: 0 10px 22px rgba(10,22,40,0.10); }
  .btn-anim { transition: transform 0.15s ease, opacity 0.15s ease; }
  .btn-anim:hover { transform: translateY(-2px); }
  .btn-anim:active { transform: translateY(0px) scale(0.97); }
  .row-hover { transition: background-color 0.15s ease, transform 0.15s ease; }
  .row-hover:hover { background-color: #fafbfc; transform: translateX(2px); }
`;

type Dash = {
  conversations: number;
  leads: number;
  meetings: number;
  handoffs: number;
  inbound: number;
  outbound: number;
  answered: number;
  missed: number;
  pickupRate: number;
  activeSessions: number;
  costUsd: number;
  tokensIn: number;
  tokensOut: number;
  recent: {
    id: string;
    channel: string;
    status: string;
    updatedAt: string;
    lead?: { name?: string | null; company?: string | null } | null;
  }[];
};

function ChartCard({
  title,
  value,
  hint,
  children,
  delay = 0,
}: {
  title: string;
  value?: string | number;
  hint?: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <div
      className="bg-white rounded-2xl p-4 flex flex-col gap-2 shadow-sm border border-gray-100 pop-in card-hover"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wider">{title}</p>
        {value !== undefined && (
          <p className="text-2xl font-semibold mt-1 text-gray-900">{value}</p>
        )}
        {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
      </div>
      <div className="h-24 mt-1">{children}</div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<Dash | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) return <p className="text-[var(--muted)]">Loading overview…</p>;

  const inbound = data.inbound;
  const outbound = data.outbound;
  const answered = data.answered;
  const missed = data.missed;
  const tokensIn = data.tokensIn;
  const tokensOut = data.tokensOut;
  const cost = data.costUsd;
  const conversations = data.conversations;
  const leads = data.leads;
  const handoffs = data.handoffs;
  const activeSessions = data.activeSessions;

  // Common options with animation from zero
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1200,
      easing: "easeOutQuart" as const,
    },
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
  };

  return (
    <div className="page-in space-y-8">
      <style>{ANIM_STYLES}</style>

      <header className="rise-in" style={{ animationDelay: "0ms" }}>
        <p className="text-xs tracking-[0.2em] uppercase text-[var(--accent)]">
          Workspace
        </p>
        <h1 className="text-3xl font-semibold mt-1 text-slate-900">Overview</h1>
        <p className="text-[var(--muted)] mt-2">
          Sessions, pickup rates, and SaaS token consumption.
        </p>
      </header>

      {/* ===== CALLS SECTION ===== */}
      <section className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* 1. Doughnut - Call Direction */}
        <ChartCard title="Call Direction" value={`${inbound + outbound} total`} delay={40}>
          <Doughnut
            data={{
              labels: ["Inbound", "Outbound"],
              datasets: [
                {
                  data:
                    inbound + outbound === 0
                      ? [1, 0] // show empty gray ring when both are 0
                      : [inbound, outbound],
                  backgroundColor:
                    inbound + outbound === 0
                      ? ["#e5e7eb", "#e5e7eb"]
                      : [ACCENT, "#8b5cf6"],
                  borderWidth: 0,
                },
              ],
            }}
            options={{
              ...commonOptions,
              cutout: "68%",
            }}
          />
        </ChartCard>

        {/* 2. Doughnut - Pickup Rate */}
        <ChartCard
          title="Pickup Rate"
          value={`${data.pickupRate}%`}
          hint={`${answered} picked up`}
          delay={90}
        >
          <Doughnut
            data={{
              labels: ["Answered", "Missed"],
              datasets: [
                {
                  data:
                    answered + missed === 0
                      ? [1, 0]
                      : [answered, missed],
                  backgroundColor:
                    answered + missed === 0
                      ? ["#e5e7eb", "#e5e7eb"]
                      : ["#22c55e", "#ef4444"],
                  borderWidth: 0,
                },
              ],
            }}
            options={{
              ...commonOptions,
              cutout: "68%",
            }}
          />
        </ChartCard>

        {/* 3. Horizontal Bar - Inbound */}
        <ChartCard title="Inbound" value={inbound} delay={140}>
          <Bar
            data={{
              labels: ["Inbound"],
              datasets: [
                {
                  data: [inbound],
                  backgroundColor: ACCENT,
                  borderRadius: 8,
                  barThickness: 18,
                },
              ],
            }}
            options={{
              ...commonOptions,
              indexAxis: "y",
              scales: {
                x: { display: false, beginAtZero: true },
                y: { display: false },
              },
            }}
          />
        </ChartCard>

        {/* 4. Horizontal Bar - Outbound */}
        <ChartCard title="Outbound" value={outbound} delay={190}>
          <Bar
            data={{
              labels: ["Outbound"],
              datasets: [
                {
                  data: [outbound],
                  backgroundColor: "#8b5cf6",
                  borderRadius: 8,
                  barThickness: 18,
                },
              ],
            }}
            options={{
              ...commonOptions,
              indexAxis: "y",
              scales: {
                x: { display: false, beginAtZero: true },
                y: { display: false },
              },
            }}
          />
        </ChartCard>
      </section>

      {/* ===== TOKENS & COST ===== */}
      <section className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* 5. Vertical Bar - Tokens comparison */}
        <ChartCard
          title="Tokens (30d)"
          value={(tokensIn + tokensOut).toLocaleString()}
          delay={40}
        >
          <Bar
            data={{
              labels: ["In", "Out"],
              datasets: [
                {
                  data: [tokensIn, tokensOut],
                  backgroundColor: [ACCENT, "#f59e0b"],
                  borderRadius: 6,
                },
              ],
            }}
            options={{
              ...commonOptions,
              scales: {
                x: { grid: { display: false }, ticks: { color: "#94a3b8" } },
                y: { display: false, beginAtZero: true },
              },
            }}
          />
        </ChartCard>

        {/* 6. Polar Area - Input Tokens */}
        <ChartCard title="Input Tokens" value={tokensIn.toLocaleString()} delay={90}>
          <PolarArea
            data={{
              labels: ["Input"],
              datasets: [
                {
                  data: [tokensIn || 0.0001], // tiny value so chart still renders
                  backgroundColor: ["rgba(30, 86, 204, 0.7)"],
                  borderWidth: 0,
                },
              ],
            }}
            options={{
              ...commonOptions,
              scales: {
                r: { display: false },
              },
            }}
          />
        </ChartCard>

        {/* 7. Polar Area - Output Tokens */}
        <ChartCard title="Output Tokens" value={tokensOut.toLocaleString()} delay={140}>
          <PolarArea
            data={{
              labels: ["Output"],
              datasets: [
                {
                  data: [tokensOut || 0.0001],
                  backgroundColor: ["rgba(245, 158, 11, 0.7)"],
                  borderWidth: 0,
                },
              ],
            }}
            options={{
              ...commonOptions,
              scales: {
                r: { display: false },
              },
            }}
          />
        </ChartCard>

        {/* 8. Line Chart - Cost trend */}
        <ChartCard title="Est. Cost (30d)" value={usdShort(cost)} delay={190}>
          <Line
            data={{
              labels: ["W1", "W2", "W3", "W4"],
              datasets: [
                {
                  data: [0, 0, 0, cost], // starts from zero → current value
                  borderColor: ACCENT,
                  backgroundColor: "rgba(30, 86, 204, 0.12)",
                  fill: true,
                  tension: 0.4,
                  pointRadius: 0,
                  borderWidth: 2,
                },
              ],
            }}
            options={{
              ...commonOptions,
              scales: {
                x: { display: false },
                y: { display: false, beginAtZero: true },
              },
            }}
          />
        </ChartCard>
      </section>

      {/* ===== ACTIVITY ===== */}
      <section className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* 9. Mini Bar - Conversations */}
        <ChartCard title="Conversations" value={conversations} delay={40}>
          <Bar
            data={{
              labels: [""],
              datasets: [
                {
                  data: [conversations],
                  backgroundColor: "#10b981",
                  borderRadius: 8,
                  barThickness: 22,
                },
              ],
            }}
            options={{
              ...commonOptions,
              scales: {
                x: { display: false },
                y: { display: false, beginAtZero: true },
              },
            }}
          />
        </ChartCard>

        {/* 10. Mini Bar - Leads */}
        <ChartCard title="Leads" value={leads} delay={90}>
          <Bar
            data={{
              labels: [""],
              datasets: [
                {
                  data: [leads],
                  backgroundColor: ACCENT,
                  borderRadius: 8,
                  barThickness: 22,
                },
              ],
            }}
            options={{
              ...commonOptions,
              scales: {
                x: { display: false },
                y: { display: false, beginAtZero: true },
              },
            }}
          />
        </ChartCard>

        {/* 11. Mini Bar - Handoffs */}
        <ChartCard title="Pending Handoffs" value={handoffs} delay={140}>
          <Bar
            data={{
              labels: [""],
              datasets: [
                {
                  data: [handoffs],
                  backgroundColor: "#f97316",
                  borderRadius: 8,
                  barThickness: 22,
                },
              ],
            }}
            options={{
              ...commonOptions,
              scales: {
                x: { display: false },
                y: { display: false, beginAtZero: true },
              },
            }}
          />
        </ChartCard>

        {/* 12. Doughnut - Active Sessions */}
        <ChartCard title="Active Sessions" value={activeSessions} delay={190}>
          <Doughnut
            data={{
              labels: ["Active", "Remaining"],
              datasets: [
                {
                  data:
                    activeSessions === 0
                      ? [0, 1]
                      : [activeSessions, Math.max(8 - activeSessions, 0)],
                  backgroundColor:
                    activeSessions === 0
                      ? ["#e5e7eb", "#e5e7eb"]
                      : ["#22c55e", "#e5e7eb"],
                  borderWidth: 0,
                },
              ],
            }}
            options={{
              ...commonOptions,
              cutout: "70%",
            }}
          />
        </ChartCard>
      </section>

      {/* Recent conversations */}
      <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 rise-in" style={{ animationDelay: "260ms" }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium text-gray-900">Recent conversations</h2>
          <div style={{ display: "flex", gap: 8 }}>
            <Link
              href="/calls"
              className="btn-anim"
              style={{
                display: "inline-flex", alignItems: "center",
                padding: "8px 18px", borderRadius: 8,
                border: `1.5px solid ${ACCENT}`, backgroundColor: "#ffffff",
                color: ACCENT, fontWeight: 700, fontSize: "0.82rem",
                textDecoration: "none",
              }}
            >
              Calls
            </Link>
            <Link
              href="/conversations"
              className="btn-anim"
              style={{
                display: "inline-flex", alignItems: "center",
                padding: "8px 18px", borderRadius: 8,
                border: `1.5px solid ${ACCENT}`, backgroundColor: ACCENT,
                color: "#ffffff", fontWeight: 700, fontSize: "0.82rem",
                textDecoration: "none",
              }}
            >
              Open all
            </Link>
          </div>
        </div>
        <div className="space-y-2">
          {data.recent.length === 0 ? (
            <p className="text-gray-400 text-sm">No conversations yet.</p>
          ) : (
            data.recent.map((c, i) => (
              <Link
                key={c.id}
                href={`/conversations/${c.id}`}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0 row-in row-hover"
                style={{ animationDelay: `${280 + i * 45}ms` }}
              >
                <div>
                  <p className="text-gray-900">
                    {c.lead?.name || "Unknown visitor"}{" "}
                    {c.lead?.company ? `· ${c.lead.company}` : ""}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {c.channel} · {c.status}
                  </p>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(c.updatedAt).toLocaleString()}
                </span>
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  );
}