import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Loader, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

type Todo = {
  id: number;
  title: string;
  description: string | null;
  completed: number;
  createdAt: string;
};

type FilterType = "all" | "completed" | "pending";

const API_BASE_URL = "http://localhost:3000";

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState("");
  const [description, setDescription] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      setError(null);
      const status = filter === "all" ? undefined : filter;
      const query = new URLSearchParams();
      if (status) query.append("status", status);

      const response = await fetch(`${API_BASE_URL}/todos?${query.toString()}`);
      if (!response.ok) throw new Error("Erro ao carregar TODOs");

      const data = await response.json();
      setTodos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar TODOs");
      setTodos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, [filter]);

  const addTodo = async () => {
    if (input.trim() === "") return;

    try {
      setIsSubmitting(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/todos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: input,
          description: description || "",
        }),
      });

      if (!response.ok) throw new Error("Erro ao adicionar TODO");

      setInput("");
      setDescription("");
      await fetchTodos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao adicionar TODO");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleComplete = async (id: number, currentCompleted: number) => {
    try {
      setError(null);
      const response = await fetch(`${API_BASE_URL}/todos/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          completed: currentCompleted === 0 ? 1 : 0,
        }),
      });

      if (!response.ok) throw new Error("Erro ao atualizar TODO");

      await fetchTodos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar TODO");
    }
  };

  const deleteTodo = async (id: number) => {
    try {
      setError(null);
      const response = await fetch(`${API_BASE_URL}/todos/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Erro ao deletar TODO");

      await fetchTodos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao deletar TODO");
    }
  };

  const filteredTodos = todos;

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isSubmitting) {
      addTodo();
    }
  };

  const stats = {
    total: todos.length,
    completed: todos.filter((t) => t.completed === 1).length,
    pending: todos.filter((t) => t.completed === 0).length,
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-background to-card p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Meus TODOs
          </h1>
          <p className="text-muted-foreground">
            Organize suas tarefas de forma simples e eficiente
          </p>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive rounded-lg p-4 mb-6 text-destructive">
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {!loading && todos.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-card border border-border rounded-lg p-4 text-center">
              <p className="text-muted-foreground text-sm mb-1">Total</p>
              <p className="text-2xl font-bold text-foreground">
                {stats.total}
              </p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4 text-center">
              <p className="text-muted-foreground text-sm mb-1">Concluídas</p>
              <p className="text-2xl font-bold text-primary">
                {stats.completed}
              </p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4 text-center">
              <p className="text-muted-foreground text-sm mb-1">Pendentes</p>
              <p className="text-2xl font-bold text-accent-foreground">
                {stats.pending}
              </p>
            </div>
          </div>
        )}

        <div className="bg-card border border-border rounded-lg p-6 mb-6 shadow-lg">
          <div className="space-y-3">
            <Input
              type="text"
              placeholder="Título da tarefa..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isSubmitting}
            />
            <textarea
              placeholder="Descrição (opcional)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              className="w-full min-h-24 px-3 py-2 rounded-md border border-input bg-transparent text-base text-foreground placeholder:text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
            />
            <Button
              onClick={addTodo}
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  Adicionando...
                </>
              ) : (
                "Adicionar Tarefa"
              )}
            </Button>
          </div>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            Todas ({stats.total})
          </Button>
          <Button
            variant={filter === "completed" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("completed")}
          >
            Concluídas ({stats.completed})
          </Button>
          <Button
            variant={filter === "pending" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("pending")}
          >
            Pendentes ({stats.pending})
          </Button>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <Loader size={32} className="text-muted-foreground animate-spin" />
            <p className="text-muted-foreground">Carregando TODOs...</p>
          </div>
        )}

        {!loading && (
          <div className="space-y-2">
            {filteredTodos.length === 0 ? (
              <div className="bg-card border border-border rounded-lg p-12 text-center">
                <p className="text-muted-foreground text-lg">
                  {filter === "all" &&
                    "Nenhuma tarefa criada. Comece adicionando uma!"}
                  {filter === "completed" && "Nenhuma tarefa concluída ainda."}
                  {filter === "pending" &&
                    "Parabéns! Todas as tarefas foram concluídas."}
                </p>
              </div>
            ) : (
              filteredTodos.map((todo) => (
                <div
                  key={todo.id}
                  className="bg-card border border-border rounded-lg p-4 flex items-center gap-3 hover:bg-accent/5 transition-colors group"
                >
                  <button
                    type="button"
                    onClick={() => toggleComplete(todo.id, todo.completed)}
                    className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      todo.completed === 1
                        ? "bg-primary border-primary"
                        : "border-muted-foreground hover:border-primary"
                    }`}
                  >
                    {todo.completed === 1 && (
                      <Check size={16} className="text-primary-foreground" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <p
                      className={`wrap-break-word transition-all font-medium ${
                        todo.completed === 1
                          ? "line-through text-muted-foreground"
                          : "text-foreground"
                      }`}
                    >
                      {todo.title}
                    </p>
                    {todo.description && (
                      <p
                        className={`text-sm wrap-break-word transition-all mt-1 ${
                          todo.completed === 1
                            ? "line-through text-muted-foreground/60"
                            : "text-muted-foreground"
                        }`}
                      >
                        {todo.description}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteTodo(todo.id)}
                    className="shrink-0 p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {!loading && todos.length > 0 && (
          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>
              Mostrando {filteredTodos.length} de {stats.total} tarefas
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
