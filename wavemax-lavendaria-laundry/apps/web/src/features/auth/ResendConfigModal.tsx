import { useState, useEffect } from "react";
import {
  getResendSettings,
  saveResendSettings,
  sendTestResendEmail,
  type ResendSettings,
} from "./resend-service";

interface ResendConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsSaved?: () => void;
}

export function ResendConfigModal({
  isOpen,
  onClose,
  onSettingsSaved,
}: ResendConfigModalProps) {
  const [settings, setSettings] = useState<ResendSettings>(() => getResendSettings());
  const [apiKey, setApiKey] = useState("");
  const [managerEmail, setManagerEmail] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      const current = getResendSettings();
      setSettings(current);
      setApiKey(current.apiKey || "");
      setManagerEmail(current.managerEmail || "");
      setSenderEmail(current.senderEmail || "Wavemax Onboarding <onboarding@resend.dev>");
      setSaveSuccess(false);
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: ResendSettings = {
      apiKey: apiKey.trim(),
      managerEmail: managerEmail.trim(),
      senderEmail: senderEmail.trim() || "Wavemax Onboarding <onboarding@resend.dev>",
    };
    saveResendSettings(updated);
    setSettings(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
    if (onSettingsSaved) onSettingsSaved();
  };

  const handleSendTest = async () => {
    if (!apiKey.trim()) {
      setTestResult({
        success: false,
        message: "Please enter your Resend API Key first.",
      });
      return;
    }
    const target = managerEmail.trim();
    if (!target || !target.includes("@")) {
      setTestResult({
        success: false,
        message: "Please enter a valid Manager Email to receive the test email.",
      });
      return;
    }

    setTestSending(true);
    setTestResult(null);

    // Save current settings first
    saveResendSettings({
      apiKey: apiKey.trim(),
      managerEmail: target,
      senderEmail: senderEmail.trim() || "Wavemax Onboarding <onboarding@resend.dev>",
    });

    const res = await sendTestResendEmail(target);
    setTestSending(false);
    if (res.success) {
      setTestResult({
        success: true,
        message: `Success! Test email sent to ${target} via Resend. Check your inbox (Message ID: ${res.messageId || "delivered"}).`,
      });
    } else {
      let errorMsg = res.error || "Failed to send test email through Resend.";
      if (errorMsg.toLowerCase().includes("testing emails to your own email address")) {
        errorMsg = `Resend Free Tier Account Mismatch: The current API Key is tied to the Resend account for sujaldhar666@gmail.com. Free Resend accounts can only deliver emails to their own registered address. To receive approval emails at ${target}, please sign up for free at resend.com using ${target}, generate an API key at resend.com/api-keys, and paste it into the field above!`;
      }
      setTestResult({
        success: false,
        message: errorMsg,
      });
    }
  };

  const isConfigured = Boolean(apiKey.trim().startsWith("re_"));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="resend-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0f1d]/70 p-4 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative w-full max-w-[560px] rounded-3xl border border-[#cbd5e1] bg-white p-6 sm:p-8 shadow-2xl">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full p-2 text-[#64748b] hover:bg-slate-100 hover:text-[#0f172a] transition"
          aria-label="Close"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1752b5] to-[#258cfb] text-white shadow-md shadow-blue-500/20">
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 id="resend-modal-title" className="text-xl font-black text-[#0f172a]">
                Resend Email Settings
              </h2>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${
                  isConfigured
                    ? "bg-green-100 text-green-700 border border-green-200"
                    : "bg-amber-100 text-amber-800 border border-amber-200"
                }`}
              >
                {isConfigured ? "Connected" : "Key Needed"}
              </span>
            </div>
            <p className="text-xs text-[#64748b]">
              Configure Resend API to deliver approval emails directly to your personal or store manager inbox.
            </p>
          </div>
        </div>

        {/* Tip Banner */}
        <div className="mt-4 rounded-xl border border-blue-200 bg-[#eff6ff] p-3 text-xs leading-relaxed text-[#1e40af]">
          <strong>How Resend works:</strong>
          <ul className="mt-1 list-disc list-inside space-y-0.5 text-[11px] text-[#2563eb]">
            <li>Get your API key at <a href="https://resend.com/api-keys" target="_blank" rel="noreferrer" className="underline font-bold">resend.com/api-keys</a>.</li>
            <li>Free Resend accounts send to your registered email address using <code className="bg-white/80 px-1 py-0.5 rounded font-mono">onboarding@resend.dev</code>.</li>
            <li>Set your <strong>Manager Email</strong> below to your email to receive approval requests!</li>
          </ul>
        </div>

        {/* Save confirmation */}
        {saveSuccess && (
          <div className="mt-3 rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 text-xs font-semibold text-emerald-800 text-center animate-fade-in">
            Resend configuration saved successfully!
          </div>
        )}

        {/* Test Result message */}
        {testResult && (
          <div
            className={`mt-3 rounded-xl p-3 text-xs font-medium leading-relaxed animate-fade-in ${
              testResult.success
                ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                : "bg-red-50 border border-red-200 text-red-700"
            }`}
          >
            {testResult.message}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSave} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#334155] mb-1">
              Resend API Key (re_...) *
            </label>
            <input
              type="password"
              placeholder="re_123456789_abcdefg..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full rounded-xl border border-[#cbd5e1] bg-white px-3.5 py-2.5 text-sm font-mono text-[#0f172a] placeholder-slate-400 outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20 transition"
            />
            <span className="mt-1 block text-[11px] text-[#64748b]">
              Your key is saved locally in this browser or can also be set in <code className="font-mono text-slate-700">apps/web/.env</code> as <code className="font-mono text-slate-700">VITE_RESEND_API_KEY</code>.
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#334155] mb-1">
              Manager Email (Where You Receive Approvals) *
            </label>
            <input
              type="email"
              placeholder="your-email@example.com"
              value={managerEmail}
              onChange={(e) => setManagerEmail(e.target.value)}
              className="w-full rounded-xl border border-[#cbd5e1] bg-white px-3.5 py-2.5 text-sm text-[#0f172a] placeholder-slate-400 outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20 transition"
            />
            <span className="mt-1 block text-[11px] text-[#64748b]">
              When an employee registers, an approval email with Approve &amp; Reject links will be dispatched to this address.
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#334155] mb-1">
              Sender Address
            </label>
            <input
              type="text"
              placeholder="Wavemax Onboarding <onboarding@resend.dev>"
              value={senderEmail}
              onChange={(e) => setSenderEmail(e.target.value)}
              className="w-full rounded-xl border border-[#cbd5e1] bg-white px-3.5 py-2 text-xs text-[#0f172a] placeholder-slate-400 outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20 transition"
            />
            <span className="mt-0.5 block text-[10px] text-[#64748b]">
              For free Resend accounts, keep <code className="font-mono">onboarding@resend.dev</code>. For verified domains, use your domain address.
            </span>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleSendTest}
              disabled={testSending || !apiKey.trim()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#93c5fd] bg-[#eff6ff] px-4 py-2.5 text-xs font-bold text-[#1d4ed8] hover:bg-[#dbeafe] transition disabled:opacity-50"
            >
              {testSending ? (
                <>
                  <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" strokeDasharray="30" strokeDashoffset="0" />
                  </svg>
                  <span>Sending Test…</span>
                </>
              ) : (
                <>
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                  <span>Send Test Email</span>
                </>
              )}
            </button>

            <div className="w-full sm:w-auto flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-[#64748b] hover:bg-slate-50 transition"
              >
                Close
              </button>
              <button
                type="submit"
                className="rounded-xl bg-[#1752b5] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/25 hover:bg-[#134293] transition"
              >
                Save Settings
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
