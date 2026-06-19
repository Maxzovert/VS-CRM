import { getCurrentUser } from "@/lib/auth/get-session";
import { PageHeader } from "@/components/shared/page-header";

export default async function SettingsPage() {
  const user = await getCurrentUser();

  return (
    <div className="space-y-8 max-w-lg">
      <PageHeader title="Settings" description="Account preferences" />

      <div className="rounded-2xl border border-[#e5e5e5] bg-[#fffaf0] p-6">
        <h2 className="text-title-md font-semibold text-[#0a0a0a] mb-4">Profile</h2>
        <div className="space-y-3 text-body-sm">
          <div className="flex justify-between py-2 border-b border-[#e5e5e5]">
            <span className="text-[#6a6a6a]">Name</span>
            <span className="font-medium text-[#0a0a0a]">{user.name}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-[#e5e5e5]">
            <span className="text-[#6a6a6a]">Email</span>
            <span className="font-medium text-[#0a0a0a]">{user.email}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-[#6a6a6a]">Member since</span>
            <span className="font-medium text-[#0a0a0a]">
              {user.createdAt.toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-[#faf5e8] p-6">
        <h2 className="text-title-md font-semibold text-[#0a0a0a] mb-3">Environment</h2>
        <div className="text-body-sm text-[#6a6a6a] space-y-1.5">
          <p>DATABASE_URL — Neon PostgreSQL</p>
          <p>RESEND_API_KEY — Email delivery</p>
          <p>AUTH_SECRET — Session encryption</p>
          <p>CRON_SECRET — Vercel cron auth</p>
        </div>
      </div>
    </div>
  );
}
