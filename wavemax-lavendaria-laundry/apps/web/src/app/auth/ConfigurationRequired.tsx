import { BrandLockup } from "../../components/ui/BrandLockup";

export function ConfigurationRequired() {
  return (
    <main className="grid min-h-screen place-items-center bg-canvas p-[22px]">
      <section
        className="w-full max-w-[520px] rounded-[18px] border border-line bg-white p-7 shadow-panel sm:p-[38px]"
        aria-labelledby="configuration-title"
      >
        <div className="mb-12">
          <BrandLockup />
        </div>
        <p className="text-[9px] font-extrabold uppercase tracking-[0.13em] text-brand">
          SECURE ACCESS
        </p>
        <h1
          className="my-3 text-3xl font-bold tracking-[-0.035em] text-ink"
          id="configuration-title"
        >
          Login is not configured yet
        </h1>
        <p className="leading-[1.65] text-muted">
          Add the Clerk publishable key to connect invitation-only accounts. For a local visual
          review, enable the documented development role preview.
        </p>
        <div className="mt-6 space-y-2.5">
          <a
            href="#staff-status"
            className="flex w-full items-center justify-between rounded-xl bg-gradient-to-r from-[#1752b5] to-[#258cfb] p-3 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:brightness-105 transition"
          >
            <span>View Employee Approval Pipeline Status (#355)</span>
            <span>→</span>
          </a>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <a
              href="#staff-register"
              className="flex items-center justify-center rounded-xl border border-line bg-[#f8fafc] py-2.5 px-3 font-semibold text-[#1e293b] hover:bg-slate-100 transition"
            >
              Employee Register
            </a>
            <a
              href="#staff-login"
              className="flex items-center justify-center rounded-xl border border-line bg-[#f8fafc] py-2.5 px-3 font-semibold text-[#1e293b] hover:bg-slate-100 transition"
            >
              Staff Sign In
            </a>
          </div>
        </div>

        <div className="mt-6 rounded-[10px] bg-amber-soft px-[15px] py-[13px] text-[11px] leading-[1.55] text-[#72551c]">
          Development preview role preview or employee onboarding routes can be accessed directly above.
        </div>
      </section>
    </main>
  );
}
