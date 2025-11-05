import { serve } from "@hono/node-server";
import app from "./app.ts";

serve({
  fetch: app.fetch,
  hostname: "0.0.0.0",
  port: 3000,
});

console.log(`Server running at http://localhost:${3000}`);
