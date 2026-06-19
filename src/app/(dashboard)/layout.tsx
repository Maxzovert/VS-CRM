import { getCurrentUser } from "@/lib/auth/get-session";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-[#fffaf0]">
      <Sidebar />
      <div className="pl-[240px]">
        <Header user={user} />
        <main className="pl-5 pr-8 py-8 w-full max-w-none">{children}</main>
      </div>
    </div>
  );
}
