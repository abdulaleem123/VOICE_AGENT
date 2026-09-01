import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function Home() {
  const session = await getSession();
  if (session?.role === "super_admin") redirect("/admin");
  if (session) redirect("/dashboard");
  redirect("/login");
}
