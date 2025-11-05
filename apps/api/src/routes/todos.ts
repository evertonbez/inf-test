import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { and, eq, like, or } from "drizzle-orm";
import { db } from "../db/index.ts";
import { todosTable } from "../db/schema.ts";
import { CreateNewTodo, TodoFilterQuery, UpdateTodo } from "./schema.ts";

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
                todoId: z.number(),
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
      tags: ["todos"],
    }),
    async (c) => {
      try {
        const { title, description } = c.req.valid("json");

        const [todoCreated] = await db
          .insert(todosTable)
          .values({ title, description, createdAt: new Date().toISOString() })
          .returning();

        return c.json({ todoId: todoCreated.id }, 200);
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
      summary: "Get all todos with optional filtering",
      description:
        "Retrieve todos with optional filtering by status (all, pending, or completed)",
      request: {
        query: TodoFilterQuery,
      },
      responses: {
        200: {
          description: "Todos found",
          content: {
            "application/json": {
              schema: z.array(
                z.object({
                  id: z.number(),
                  title: z.string(),
                  description: z.string().nullable(),
                  completed: z.number().nullable(),
                  createdAt: z.string(),
                }),
              ),
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
      tags: ["todos"],
    }),
    async (c) => {
      try {
        const { status, search } = c.req.valid("query");

        let query = db.select().from(todosTable);
        const conditions = [];

        if (status === "pending") {
          conditions.push(eq(todosTable.completed, 0));
        } else if (status === "completed") {
          conditions.push(eq(todosTable.completed, 1));
        }

        if (search?.trim()) {
          const searchPattern = `%${search}%`;
          conditions.push(
            or(
              like(todosTable.title, searchPattern),
              like(todosTable.description, searchPattern),
            ),
          );
        }

        if (conditions.length > 0) {
          if (conditions.length === 1) {
            query = query.where(conditions[0]) as any;
          } else {
            query = query.where(and(...conditions)) as any;
          }
        }

        const todos = await query;
        return c.json(todos);
      } catch (error) {
        console.error("Error fetching todos:", error);
        return c.json(
          {
            error: "Internal server error",
            code: "INTERNAL_ERROR",
          },
          500,
        ) as any;
      }
    },
  )
  .openapi(
    createRoute({
      method: "get",
      path: "/{id}",
      summary: "Get a todo by ID",
      request: {
        params: z.object({
          id: z.string(),
        }),
      },
      responses: {
        200: {
          description: "Todo found",
          content: {
            "application/json": {
              schema: z.object({
                id: z.number(),
                title: z.string(),
                description: z.string().nullable(),
                completed: z.number().nullable(),
                createdAt: z.string(),
              }),
            },
          },
        },
        400: {
          description: "Invalid ID format",
          content: {
            "application/json": {
              schema: z.object({
                error: z.string(),
                code: z.string(),
              }),
            },
          },
        },
        404: {
          description: "Todo not found",
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
      tags: ["todos"],
    }),
    async (c) => {
      try {
        const id = parseInt(c.req.param("id"), 10);

        if (Number.isNaN(id)) {
          return c.json(
            {
              error: "Invalid ID format",
              code: "INVALID_ID",
            },
            400,
          ) as any;
        }

        const [todo] = await db
          .select()
          .from(todosTable)
          .where(eq(todosTable.id, id));

        if (!todo) {
          return c.json(
            {
              error: "Todo not found",
              code: "NOT_FOUND",
            },
            404,
          ) as any;
        }

        return c.json(todo);
      } catch (error) {
        console.error("Error fetching todo:", error);
        return c.json(
          {
            error: "Internal server error",
            code: "INTERNAL_ERROR",
          },
          500,
        ) as any;
      }
    },
  )
  .openapi(
    createRoute({
      method: "patch",
      path: "/{id}",
      summary: "Update a todo",
      request: {
        params: z.object({
          id: z.string(),
        }),
        body: {
          content: {
            "application/json": {
              schema: UpdateTodo,
            },
          },
        },
      },
      responses: {
        200: {
          description: "Todo updated",
          content: {
            "application/json": {
              schema: z.object({
                id: z.number(),
                title: z.string(),
                description: z.string().nullable(),
                completed: z.number().nullable(),
                createdAt: z.string(),
              }),
            },
          },
        },
        400: {
          description: "Invalid ID format",
          content: {
            "application/json": {
              schema: z.object({
                error: z.string(),
                code: z.string(),
              }),
            },
          },
        },
        404: {
          description: "Todo not found",
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
      tags: ["todos"],
    }),
    async (c) => {
      try {
        const id = parseInt(c.req.param("id"), 10);

        if (Number.isNaN(id)) {
          return c.json(
            {
              error: "Invalid ID format",
              code: "INVALID_ID",
            },
            400,
          ) as any;
        }

        const updateData = c.req.valid("json");

        const [updated] = await db
          .update(todosTable)
          .set(updateData)
          .where(eq(todosTable.id, id))
          .returning();

        if (!updated) {
          return c.json(
            {
              error: "Todo not found",
              code: "NOT_FOUND",
            },
            404,
          ) as any;
        }

        return c.json(updated);
      } catch (error) {
        console.error("Error updating todo:", error);
        return c.json(
          {
            error: "Internal server error",
            code: "INTERNAL_ERROR",
          },
          500,
        ) as any;
      }
    },
  )
  .openapi(
    createRoute({
      method: "delete",
      path: "/{id}",
      summary: "Delete a todo",
      request: {
        params: z.object({
          id: z.string(),
        }),
      },
      responses: {
        200: {
          description: "Todo deleted",
          content: {
            "application/json": {
              schema: z.object({
                success: z.boolean(),
              }),
            },
          },
        },
        400: {
          description: "Invalid ID format",
          content: {
            "application/json": {
              schema: z.object({
                error: z.string(),
                code: z.string(),
              }),
            },
          },
        },
        404: {
          description: "Todo not found",
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
      tags: ["todos"],
    }),
    async (c) => {
      try {
        const id = parseInt(c.req.param("id"), 10);

        if (Number.isNaN(id)) {
          return c.json(
            {
              error: "Invalid ID format",
              code: "INVALID_ID",
            },
            400,
          ) as any;
        }

        const deleted = await db
          .delete(todosTable)
          .where(eq(todosTable.id, id));

        if (deleted.rowsAffected === 0) {
          return c.json(
            {
              error: "Todo not found",
              code: "NOT_FOUND",
            },
            404,
          ) as any;
        }

        return c.json({ success: true });
      } catch (error) {
        console.error("Error deleting todo:", error);
        return c.json(
          {
            error: "Internal server error",
            code: "INTERNAL_ERROR",
          },
          500,
        ) as any;
      }
    },
  );

export const todosRoute = app;
