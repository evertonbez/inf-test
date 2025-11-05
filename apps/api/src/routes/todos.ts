import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { CreateNewTodo } from "./schema.ts";

const app = new OpenAPIHono()
  .openapi(
    createRoute({
      method: "post",
      path: "/",
      summary: "Create a new todo",
      request: {
        body: {
          content: {
            "application/json": {
              schema: CreateNewTodo,
            },
          },
        },
      },
      responses: {
        200: {
          description: "Todo created",
          content: {
            "application/json": {
              schema: z.object({
                todoId: z.string(),
              }),
            },
          },
        },
        400: {
          description: "Validation error",
          content: {
            "application/json": {
              schema: z.object({
                error: z.string(),
                code: z.string(),
              }),
            },
          },
        },
        500: {
          description: "Internal server error",
          content: {
            "application/json": {
              schema: z.object({
                error: z.string(),
                code: z.string(),
              }),
            },
          },
        },
      },
      tags: ["jobs"],
    }),
    async (c) => {
      try {
        return c.json({});
      } catch (error) {
        console.error("Error creating todo:", error);
        return c.json(
          {
            error: "Internal server error",
            code: "INTERNAL_ERROR",
          },
          500,
        );
      }
    },
  )
  .openapi(
    createRoute({
      method: "get",
      path: "/",
      summary: "Get all jobs",
      responses: {
        200: {
          description: "Jobs found",
        },
      },
      tags: ["jobs"],
    }),
    async (c) => {
      const jobs = await getJobsQuery(db, {
        limit: 30,
        orderBy: "createdAt",
        orderDirection: "desc",
      });

      return c.json({ data: jobs });
    },
  )
  .openapi(
    createRoute({
      method: "get",
      path: "/{id}",
      summary: "Get a job by ID",
      responses: {
        200: {
          description: "Job found",
        },
      },
      tags: ["jobs"],
    }),
    async (c) => {
      const id = c.req.param("id");

      const job = await getJobByIdQuery(db, id);

      return c.json({ data: job });
    },
  );

export const jobsRoute = app;
