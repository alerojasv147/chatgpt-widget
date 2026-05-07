import { useCallback, useEffect, useState } from "react";
import type { ToolInput, ToolOutput } from "./openai";

function useOpenAi() {
  const [toolOutput, setToolOutput] = useState<ToolOutput>(
    () => window.openai?.toolOutput
  );
  const [toolInput, setToolInput] = useState<ToolInput>(
    () => window.openai?.toolInput
  );

  useEffect(() => {
    const onSetGlobals = (e: WindowEventMap["openai:set_globals"]) => {
      const next = e.detail?.globals ?? {};
      if ("toolOutput" in next) setToolOutput(next.toolOutput);
      if ("toolInput" in next) setToolInput(next.toolInput);
    };
    window.addEventListener("openai:set_globals", onSetGlobals, {
      passive: true,
    });
    return () =>
      window.removeEventListener("openai:set_globals", onSetGlobals);
  }, []);

  return { toolInput, toolOutput, bridge: window.openai };
}

interface WidgetOutput {
  type?: "hello" | "time";
  greeting?: string;
  emoji?: string;
  count?: number;
  subtitle?: string;
  timezone?: string;
}

export function App() {
  const { toolInput, toolOutput, bridge } = useOpenAi();
  const out = (toolOutput ?? {}) as WidgetOutput;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPreview = !bridge && !out.greeting;

  const callTool = useCallback(
    async (toolName: string, args: Record<string, unknown>) => {
      if (!bridge?.callTool) return;
      setBusy(true);
      setError(null);
      try {
        await bridge.callTool(toolName, args);
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Ocurrió un error inesperado";
        setError(msg);
      } finally {
        setBusy(false);
      }
    },
    [bridge]
  );

  function handleReroll() {
    const name =
      (toolInput as Record<string, unknown> | undefined)?.["name"] ??
      out.greeting
        ?.replace(/^[¡!¿?🕐\s]+/, "")
        .split(",")[0]
        ?.split(" ")
        .pop() ??
      "amigo";
    callTool("show_hello", { name });
  }

  const subtitleText =
    out.type === "time"
      ? `${out.subtitle ?? ""} · ${out.timezone ?? "UTC"}`
      : isPreview
        ? "Estás viendo el widget en modo dev (Vite). En ChatGPT se hidrata desde la tool."
        : `Invocación #${out.count ?? 1}`;

  return (
    <main className="card">
      <header className="card__header">
        <div className="emoji-wrapper">
          <span className="emoji" role="img" aria-label="icono">
            {out.emoji ?? "👋"}
          </span>
        </div>
        <h1 className="title">
          {out.greeting ?? (isPreview ? "Modo preview" : "Cargando…")}
        </h1>
      </header>

      <p className="subtitle">
        {subtitleText}
        {out.type === "hello" && out.count != null && (
          <>
            {" · "}
            <span className="badge">show_hello</span>
          </>
        )}
        {out.type === "time" && (
          <>
            {" · "}
            <span className="badge">show_time</span>
          </>
        )}
      </p>

      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}

      {bridge?.callTool && (
        <button
          className="btn"
          onClick={handleReroll}
          disabled={busy}
          aria-busy={busy}
        >
          {busy && <span className="spinner" />}
          {busy ? "Saludando…" : "Saludar otra vez"}
        </button>
      )}

      <details className="debug">
        <summary>Datos crudos</summary>
        <pre>{JSON.stringify({ toolInput, toolOutput }, null, 2)}</pre>
      </details>
    </main>
  );
}
