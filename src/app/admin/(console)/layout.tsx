import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AdminSidebar } from "@/components/AdminSidebar";
import { AdminTopbar  } from "@/components/AdminTopbar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (session.role !== "super_admin") redirect("/dashboard");

  return (
    <div style={{ minHeight: "100vh", display: "flex", backgroundColor: "#ffffff" }}>
      <AdminSidebar name={session.name} />
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <AdminTopbar name={session.name} />
        <main style={{ flex: 1, padding: "32px 40px", overflowX: "hidden" }}>
          {children}
        </main>
      </div>
    </div>
  );
}