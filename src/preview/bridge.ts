import { readFile } from "node:fs/promises";
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { fileURLToPath } from "node:url";
import httpProxy from "http-proxy";

export interface PreviewBridgeConfig {
  upstreamUrl: string;
  port: number;
  host?: string;
  inspectorScriptPath?: string;
}

export class PreviewBridge {
  private server: Server | undefined;
  private inspectorScript = "";

  constructor(private readonly config: PreviewBridgeConfig) {}

  get url(): string {
    return `http://${this.config.host ?? "127.0.0.1"}:${this.config.port}/`;
  }

  async start(): Promise<string> {
    if (this.server) return this.url;
    const scriptPath =
      this.config.inspectorScriptPath ??
      fileURLToPath(new URL("./inspector.js", import.meta.url));
    this.inspectorScript = await readFile(scriptPath, "utf8");

    const proxy = httpProxy.createProxyServer({
      target: this.config.upstreamUrl,
      ws: true,
      changeOrigin: false,
    });
    proxy.on("error", (_error, _request, response) => {
      if (response && "writeHead" in response && !response.headersSent) {
        response.writeHead(502, { "content-type": "text/plain; charset=utf-8" });
        response.end("Kurenai preview upstream is unavailable");
      }
    });

    const server = createServer((request, response) => {
      void this.handleHttp(proxy, request, response);
    });
    server.on("upgrade", (request, socket, head) => {
      proxy.ws(request, socket, head);
    });

    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen(
        this.config.port,
        this.config.host ?? "127.0.0.1",
        () => {
          server.off("error", reject);
          resolve();
        },
      );
    });
    this.server = server;
    return this.url;
  }

  async stop(): Promise<void> {
    const server = this.server;
    this.server = undefined;
    if (!server) return;
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }

  private async handleHttp(
    proxy: httpProxy,
    request: IncomingMessage,
    response: ServerResponse,
  ): Promise<void> {
    const url = new URL(request.url ?? "/", this.url);
    if (url.pathname === "/__kurenai/inspector.js") {
      response.writeHead(200, {
        "content-type": "text/javascript; charset=utf-8",
        "cache-control": "no-store",
      });
      response.end(this.inspectorScript);
      return;
    }

    if (request.method === "GET" && url.pathname === "/") {
      try {
        const upstream = await fetch(
          new URL(`${url.pathname}${url.search}`, this.config.upstreamUrl),
        );
        const html = injectInspector(await upstream.text());
        response.writeHead(upstream.status, {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store",
        });
        response.end(html);
      } catch (error) {
        response.writeHead(502, {
          "content-type": "text/plain; charset=utf-8",
        });
        response.end(
          `Kurenai preview upstream failed: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
      return;
    }

    proxy.web(request, response);
  }
}

export function injectInspector(html: string): string {
  const tag = '<script src="/__kurenai/inspector.js"></script>';
  if (html.includes(tag)) return html;
  const bodyEnd = html.lastIndexOf("</body>");
  return bodyEnd >= 0
    ? `${html.slice(0, bodyEnd)}${tag}${html.slice(bodyEnd)}`
    : `${html}${tag}`;
}
