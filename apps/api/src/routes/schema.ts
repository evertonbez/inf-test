import { z } from "@hono/zod-openapi";

export const CreateNewTodo = z
  .object({
    title: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    dueDate: z.string().optional(),
    completed: z.boolean().optional(),
  })
  .openapi("CreateNewTodo");
