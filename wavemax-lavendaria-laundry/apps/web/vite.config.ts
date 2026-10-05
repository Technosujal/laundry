import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv, type Plugin } from "vite";
import { Resend } from "resend";

function resendDevPlugin(apiKeyFromEnv?: string): Plugin {
  return {
    name: "resend-dev-middleware",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === "/api/send-email" && req.method === "POST") {
          let body = "";
          req.on("data", (chunk: Buffer) => {
            body += chunk.toString();
          });
          req.on("end", async () => {
            res.setHeader("Content-Type", "application/json");
            try {
              const payload = JSON.parse(body || "{}");
              const apiKey =
                payload.apiKey ||
                apiKeyFromEnv ||
                process.env.RESEND_API_KEY ||
                process.env.VITE_RESEND_API_KEY;

              if (!apiKey) {
                res.statusCode = 400;
                res.end(
                  JSON.stringify({
                    success: false,
                    error:
                      "No Resend API Key configured. Please add your Resend API Key (re_...) in the settings or .env file.",
                  }),
                );
                return;
              }

              const resend = new Resend(apiKey);
              const result = await resend.emails.send({
                from: payload.from || "Wavemax Onboarding <onboarding@resend.dev>",
                to: Array.isArray(payload.to) ? payload.to : [payload.to],
                subject: payload.subject,
                html: payload.html,
              });

              if (result.error) {
                res.statusCode = 400;
                res.end(
                  JSON.stringify({
                    success: false,
                    error: result.error.message || JSON.stringify(result.error),
                  }),
                );
                return;
              }

              res.statusCode = 200;
              res.end(JSON.stringify({ success: true, data: result.data }));
            } catch (err: unknown) {
              const message = err instanceof Error ? err.message : "Internal server error";
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: message }));
            }
          });
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [
      react(),
      tailwindcss(),
      resendDevPlugin(env.VITE_RESEND_API_KEY || env.RESEND_API_KEY),
    ],
    server: { port: 5173 },
    test: {
      environment: "jsdom",
      setupFiles: "./src/test/setup.ts",
      fileParallelism: false,
    },
  };
});

