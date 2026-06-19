import { LoginForm } from "@/components/auth/login-form";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen bg-[#fffaf0]">
      <div className="hidden lg:flex flex-1 items-center justify-center p-12 bg-[#faf5e8]">
        <div className="max-w-md">
          <div className="rounded-3xl bg-[#ff4d8b] p-10 text-white mb-8">
            <p className="text-caption-uppercase opacity-80 mb-3">Verience CRM</p>
            <h2 className="text-[32px] font-medium leading-tight tracking-tight">
              Go to market with clarity
            </h2>
            <p className="mt-4 text-sm opacity-90 leading-relaxed">
              Track clients, follow-ups, invoices and payments — all in one warm workspace built for freelancers.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-[#b8a4ed] p-5 text-[#0a0a0a]">
              <p className="text-sm font-semibold">Clients</p>
              <p className="text-xs mt-1 opacity-80">Manage your pipeline</p>
            </div>
            <div className="rounded-2xl bg-[#ffb084] p-5 text-[#0a0a0a]">
              <p className="text-sm font-semibold">Revenue</p>
              <p className="text-xs mt-1 opacity-80">Track every payment</p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ff4d8b] text-white font-semibold">
              V
            </span>
            <h1 className="text-display-sm text-[#0a0a0a] mt-4">Welcome back</h1>
            <p className="text-body-sm text-[#6a6a6a]">Sign in to your CRM</p>
          </div>
          <LoginForm />
          <p className="text-center text-body-sm text-[#6a6a6a]">
            No account?{" "}
            <Link href="/register" className="font-semibold text-[#0a0a0a] hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
