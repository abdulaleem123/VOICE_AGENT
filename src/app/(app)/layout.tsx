import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "super_admin") redirect("/admin");

  return (
    <div style={{ minHeight: "100vh", display: "flex", backgroundColor: "#ffffff" }}>
      <Sidebar name={session.name} />
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <Topbar name={session.name} />
        <main style={{ flex: 1, padding: "32px 40px", overflowX: "hidden" }}>
          {children}
        </main>
      </div>
    </div>
  );
}