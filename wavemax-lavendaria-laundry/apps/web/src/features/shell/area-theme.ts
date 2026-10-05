import type { ProductArea } from "../../app/auth/session-types";

export interface AreaTheme {
  accent: string;
  soft: string;
}

export const areaTheme: Record<ProductArea, AreaTheme> = {
  "command-center": { accent: "#2563eb", soft: "#eaf2ff" },
  executive: { accent: "#2563eb", soft: "#eaf2ff" },
  orders: { accent: "#9333ea", soft: "#f7edff" },
  operations: { accent: "#0f9f9a", soft: "#e8fbf8" },
  analytics: { accent: "#4f46e5", soft: "#eeefff" },
  finance: { accent: "#0d9488", soft: "#e8f8f5" },
  workforce: { accent: "#e58a05", soft: "#fff7e6" },
  inventory: { accent: "#0f9f6e", soft: "#e8fbf3" },
  "data-sources": { accent: "#0891b2", soft: "#e8f8fc" },
};
