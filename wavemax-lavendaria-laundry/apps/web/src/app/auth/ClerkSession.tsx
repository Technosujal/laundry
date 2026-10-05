import { Show, SignIn, useAuth } from "@clerk/react";
import { useEffect, useMemo, useState } from "react";

import { BrandLockup } from "../../components/ui/BrandLockup";
import { createHttpAnalyticsGateway } from "../../features/analytics/analytics-gateway";
import { createHttpOrdersGateway } from "../../features/orders/orders-gateway";
import { AppShell } from "../../features/shell/AppShell";
import type { Session } from "./session-types";

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000/v1";

function AuthorizedApplication() {
  const { getToken } = useAuth();
  const [session, setSession] = useState<Session | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "denied" | "error">("loading");
  const ordersGateway = useMemo(() => createHttpOrdersGateway(apiUrl, getToken), [getToken]);
  const analyticsGateway = useMemo(() => createHttpAnalyticsGateway(apiUrl, getToken), [getToken]);

  useEffect(() => {
    const controller = new AbortController();
    async function loadSession() {
      try {
        const token = await getToken();
        const response = await fetch(`${apiUrl}/session`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          signal: controller.signal,
        });
        if (response.status === 401 || response.status === 403) {
          setState("denied");
          return;
        }
        if (!response.ok) throw new Error("Session request failed");
        const loaded = (await response.json()) as Session;
        setSession(
          loaded.role === "OWNER" && loaded.permittedAreas.includes("analytics")
            ? { ...loaded, permittedAreas: ["executive", ...loaded.permittedAreas] }
            : loaded,
        );
        setState("ready");
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setState("error");
      }
    }
    void loadSession();
    return () => controller.abort();
  }, [getToken]);

  if (state === "loading") return <StatusGate title="Checking your access…" />;
  if (state === "denied") {
    return (
      <StatusGate
        title="Your account is not assigned"
        message="Ask the owner to add this invited account to the Wavemax store."
      />
    );
  }
  if (state === "error") {
    return (
      <StatusGate
        title="Wavemax could not verify access"
        message="The service may be unavailable. Refresh after the API connection is restored."
      />
    );
  }
  return session ? (
    <AppShell session={session} ordersGateway={ordersGateway} analyticsGateway={analyticsGateway} />
  ) : null;
}

function StatusGate({ title, message }: { title: string; message?: string }) {
  return (
    <main className="grid min-h-screen place-items-center bg-canvas p-[22px]">
      <section
        className="w-full max-w-[520px] rounded-[18px] border border-line bg-white p-7 shadow-panel sm:p-[38px]"
        role="status"
      >
        <span className="inline-flex rounded-lg bg-brand-soft px-2.5 py-1 text-xs font-bold text-brand">
          WAVEMAX
        </span>
        <h1 className="mt-5 text-3xl font-bold tracking-[-0.035em] text-ink">{title}</h1>
        {message ? <p className="mt-3 leading-[1.65] text-muted">{message}</p> : null}
      </section>
    </main>
  );
}

export function ClerkSession() {
  return (
    <>
      <Show when="signed-out">
        <main className="grid min-h-screen grid-cols-1 bg-[#17181a] text-white lg:grid-cols-[1.15fr_0.85fr]">
          <div className="sign-in-glow flex min-h-[42vh] flex-col justify-center p-7 sm:min-h-[46vh] sm:p-[42px] lg:min-h-screen lg:p-[clamp(36px,8vw,120px)]">
            <div className="mb-[70px] lg:mb-auto">
              <BrandLockup inverse />
            </div>
            <p className="text-[9px] font-extrabold uppercase tracking-[0.13em] text-[#9bb9ff]">
              ONE STORE. ONE OPERATING VIEW.
            </p>
            <h1 className="my-[18px] max-w-[650px] text-[38px] font-bold leading-[1.02] tracking-[-0.055em] sm:text-[clamp(42px,5vw,72px)]">
              Run the day with complete context.
            </h1>
            <p className="text-base text-[#b5b6bc]">
              Invitation-only access for the owner, managers, and employees.
            </p>
          </div>
          <div className="grid place-items-center bg-canvas px-3 py-[22px] sm:p-[30px]">
            <SignIn routing="hash" />
          </div>
        </main>
      </Show>
      <Show when="signed-in">
        <AuthorizedApplication />
      </Show>
    </>
  );
}
