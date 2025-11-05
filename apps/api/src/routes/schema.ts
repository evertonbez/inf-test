import { z } from "@hono/zod-openapi";

export const CreateNewTodo = z
  .object({
    title: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
  })
  .openapi("CreateNewTodo");

export const UpdateTodo = z
  .object({
    title: z.string().min(1).max(100).optional(),
    description: z.string().max(500).nullable().optional(),
    completed: z.number().int().min(0).max(1).optional(),
  })
  .openapi("UpdateTodo");

export const TodoFilterQuery = z
  .object({
    status: z
      .enum(["all", "pending", "completed"])
      .default("all")
      .describe("Filter TODOs by status: all, pending, or completed"),
    search: z
      .string()
      .optional()
      .describe("Search in title and description (case-insensitive)"),
  })
  .openapi("TodoFilterQuery");
