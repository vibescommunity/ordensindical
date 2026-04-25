import { useState, useRef, useEffect } from "react";
import { X, Terminal } from "lucide-react";
import { trpc } from "@/providers/trpc";

interface ConsoleMessage {
  id: number;
  time: string;
  type: "INFO" | "WARN" | "ERROR" | "AUTH" | "SYSTEM";
  text: string;
}

const typeColors: Record<string, string> = {
  INFO: "#00ff88",
  WARN: "#FFD700",
  ERROR: "#ff3333",
  AUTH: "#00ccff",
  SYSTEM: "#888",
};

export function TerminalConsole({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<ConsoleMessage[]>([
    {
      id: 0,
      time: new Date().toLocaleTimeString("es-ES", { hour12: false }),
      type: "SYSTEM",
      text: "Shadow Command v1.0.0 - Sistema iniciado",
    },
    {
      id: 1,
      time: new Date().toLocaleTimeString("es-ES", { hour12: false }),
      type: "INFO",
      text: "Conexion establecida con el servidor principal",
    },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const nextId = useRef(2);

  const { data: recentLogs } = trpc.log.recent.useQuery(
    { limit: 10 },
    { refetchInterval: 5000, enabled: isOpen }
  );

  useEffect(() => {
    if (recentLogs && recentLogs.length > 0) {
      const logMessages: ConsoleMessage[] = recentLogs.map((log) => ({
        id: nextId.current++,
        time: new Date(log.createdAt).toLocaleTimeString("es-ES", { hour12: false }),
        type: (log.type === "login" || log.type === "auth"
          ? "AUTH"
          : log.type === "system"
            ? "SYSTEM"
            : log.type === "delete"
              ? "ERROR"
              : "INFO") as ConsoleMessage["type"],
        text: `[${log.username || "SISTEMA"}] ${log.action}${log.details ? `: ${log.details}` : ""}`,
      }));

      setMessages((prev) => {
        const existingTexts = new Set(prev.map((m) => m.text));
        const newMessages = logMessages.filter(
          (m) => !existingTexts.has(m.text)
        );
        return [...prev, ...newMessages].slice(-50);
      });
    }
  }, [recentLogs]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMsg: ConsoleMessage = {
      id: nextId.current++,
      time: new Date().toLocaleTimeString("es-ES", { hour12: false }),
      type: "SYSTEM",
      text: `> ${input}`,
    };

    setMessages((prev) => [...prev, newMsg]);

    // Simulate command response
    const responses: Record<string, string> = {
      help: "Comandos disponibles: help, clear, status, whoami, date, echo",
      clear: "__CLEAR__",
      status: "Sistema operativo. Todos los servicios activos.",
      whoami: "Usuario autenticado en Shadow Command",
      date: new Date().toLocaleString("es-ES"),
    };

    const cmd = input.trim().toLowerCase().split(" ")[0];
    const response =
      responses[cmd] || `Comando no reconocido: ${cmd}. Escribe 'help' para ayuda.`;

    if (response === "__CLEAR__") {
      setMessages([]);
    } else {
      setTimeout(() => {
        const respMsg: ConsoleMessage = {
          id: nextId.current++,
          time: new Date().toLocaleTimeString("es-ES", { hour12: false }),
          type: "INFO",
          text: response,
        };
        setMessages((prev) => [...prev, respMsg]);
      }, 100);
    }

    setInput("");
  };

  return (
    <div
      className="fixed transition-transform duration-300 ease-in-out"
      style={{
        bottom: 0,
        left: 260,
        right: 0,
        height: 250,
        background: "var(--color-bg-primary)",
        borderTop: "1px solid rgba(255, 215, 0, 0.2)",
        zIndex: 40,
        transform: isOpen ? "translateY(0)" : "translateY(100%)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4"
        style={{
          height: 32,
          borderBottom: "1px solid rgba(255, 215, 0, 0.1)",
        }}
      >
        <div className="flex items-center gap-2">
          <Terminal size={12} style={{ color: "var(--color-gold-dim)" }} />
          <span
            className="text-xs uppercase tracking-wider"
            style={{ color: "var(--color-text-muted)" }}
          >
            Consola de Sistema
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 cursor-pointer"
          style={{ color: "var(--color-text-muted)" }}
        >
          <X size={14} />
        </button>
      </div>

      {/* Messages */}
      <div
        className="overflow-y-auto px-4 py-2"
        style={{ height: "calc(100% - 72px)" }}
      >
        {messages.map((msg) => (
          <div key={msg.id} className="flex gap-2 mb-1 text-xs">
            <span style={{ color: "var(--color-text-muted)" }}>
              [{msg.time}]
            </span>
            <span style={{ color: typeColors[msg.type], fontWeight: 600 }}>
              [{msg.type}]
            </span>
            <span style={{ color: msg.type === "SYSTEM" ? "#888" : "#c4a000" }}>
              {msg.text}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center px-4"
        style={{
          height: 40,
          borderTop: "1px solid rgba(255, 215, 0, 0.1)",
        }}
      >
        <span
          className="text-sm mr-2"
          style={{ color: "var(--color-gold-primary)" }}
        >
          &gt;
        </span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escriba un comando..."
          className="flex-1 bg-transparent text-xs outline-none"
          style={{
            color: "var(--color-gold-primary)",
            caretColor: "var(--color-gold-primary)",
          }}
        />
      </form>
    </div>
  );
}
