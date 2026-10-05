import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { AuthBoundary } from "./app/auth/AuthBoundary";
import "./styles/global.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthBoundary />
  </StrictMode>,
);
