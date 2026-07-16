import { RegisterForm } from "@/components/auth/register-form";
import { VerienceLogo } from "@/components/brand/verience-logo";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen bg-[#fffaf0]">
      <div className="hidden lg:flex flex-1 items-center justify-center p-12 bg-[#1a3a3a]">
        <div className="max-w-md text-white">
          <p className="text-caption-uppercase text-white/60 mb-3">Get started</p>
          <h2 className="text-[40px] font-medium leading-tight tracking-tight">
            Your personal CRM for freelance work
          </h2>
          <p className="mt-4 text-sm text-white/80 leading-relaxed">
            Clients, projects, invoices, follow-ups — organized beautifully.
          </p>
          <div className="mt-8 rounded-2xl bg-[#ff4d8b] p-6">
            <p className="font-semibold">Free to start</p>
            <p className="text-sm mt-1 opacity-90">Set up in under a minute.</p>
          </div>
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2">
            <VerienceLogo size={40} />
            <h1 className="text-display-sm text-[#0a0a0a] mt-4">Create account</h1>
            <p className="text-body-sm text-[#6a6a6a]">Start managing your clients</p>
          </div>
          <RegisterForm />
          <p className="text-center text-body-sm text-[#6a6a6a]">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-[#0a0a0a] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
