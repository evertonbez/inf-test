import { OpenAPIHono } from "@hono/zod-openapi";
import { Scalar } from "@scalar/hono-api-reference";
import { cors } from "hono/cors";
import { requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";

const app = new OpenAPIHono({
  defaultHook: (result, c) => {
    if (!result.success) {
      return c.json({
        success: false,
        errors: result.error.flatten().fieldErrors,
      });
    }
  },
});

app.use("*", requestId());
app.use(secureHeaders());
app.use(cors());

app.get("/health", async (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() }, 200);
});

// app.route("/api/jobs", jobsRoute);

app.doc("/openapi", {
  openapi: "3.1.0",
  info: {
    version: "0.0.1",
    title: "Cograde API",
    description: "Cograde challenge API.",
  },
});

app.get(
  "/",
  Scalar({ url: "/openapi", pageTitle: "Cograde API", theme: "saturn" }),
);

export default app;
