import { ClerkProvider } from "@clerk/react";
import { useEffect, useState } from "react";

import { ClerkSession } from "./ClerkSession";
import { ConfigurationRequired } from "./ConfigurationRequired";
import { DevelopmentSession } from "./DevelopmentSession";

const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY?.trim();
const rolePreviewEnabled =
  import.meta.env.DEV &&
  (import.meta.env.MODE === "local-preview" || import.meta.env.VITE_ENABLE_ROLE_PREVIEW === "true");

export function AuthBoundary() {
  const [hash, setHash] = useState(() =>
    typeof window !== "undefined" ? window.location.hash.slice(1).toLowerCase() : "",
  );

  useEffect(() => {
    const handleHash = () => setHash(window.location.hash.slice(1).toLowerCase());
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  const routeName = hash.split("?")[0] || "";
  const isStaffPortalRoute = [
    "staff-status",
    "status",
    "staff-register",
    "register",
    "staff-login",
    "login",
    "signin",
    "manager-approvals",
    "approvals",
    "staff-portal",
  ].includes(routeName);

  if (rolePreviewEnabled || isStaffPortalRoute) return <DevelopmentSession />;
  if (!clerkKey) return <ConfigurationRequired />;
  return (
    <ClerkProvider publishableKey={clerkKey} afterSignOutUrl="/">
      <ClerkSession />
    </ClerkProvider>
  );
}
