/**
 * Tipos mínimos del bridge `window.openai` que ChatGPT inyecta dentro del
 * iframe del widget. Documentación oficial:
 *   https://developers.openai.com/apps-sdk/build/chatgpt-ui
 *
 * Los nombres exactos del bridge MCP Apps son los mismos en TS/JS.
 */

export type ToolInput = Record<string, unknown> | undefined;
export type ToolOutput = Record<string, unknown> | undefined;

export interface CallToolResult {
  structuredContent?: Record<string, unknown>;
  content?: Array<{ type: string; text?: string }>;
  _meta?: Record<string, unknown>;
}

export interface OpenAiBridge {
  /** Argumentos con los que se invocó la tool. */
  toolInput?: ToolInput;
  /** `structuredContent` devuelto por la tool en el último call. */
  toolOutput?: ToolOutput;
  /** Estado persistido del widget entre renders. */
  widgetState?: Record<string, unknown>;
  /** Locale negociado por el host. */
  locale?: string;

  /** Llamar otra tool del MCP server desde el widget. */
  callTool?: (
    name: string,
    args?: Record<string, unknown>
  ) => Promise<CallToolResult>;
  /** Persistir el estado del widget. */
  setWidgetState?: (state: Record<string, unknown>) => Promise<void>;
  /** Pedir cerrar el widget. */
  requestClose?: () => Promise<void>;
  /** Cambiar layout: "inline" | "pip" | "fullscreen". */
  requestDisplayMode?: (opts: {
    mode: "inline" | "pip" | "fullscreen";
  }) => Promise<void>;
}

declare global {
  interface Window {
    openai?: OpenAiBridge;
  }

  interface WindowEventMap {
    /** ChatGPT dispara este evento cuando cambia toolInput/toolOutput/widgetState. */
    "openai:set_globals": CustomEvent<{
      globals: Partial<OpenAiBridge>;
    }>;
  }
}

export {};
