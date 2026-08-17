export interface DshToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  output: {
    schema: Record<string, unknown>;
    render(args: unknown, value: unknown): Array<{ type: "text"; text: string }>;
  };
  execute(args: unknown, execution?: DshToolExecution): Promise<unknown>;
}

export interface DshToolExecution {
  agent?: {
    id: string;
    session?: {
      header?: {
        cwd?: string;
      };
    };
  };
}

export interface DshContext {
  tools: {
    register(definition: DshToolDefinition): unknown;
  };
  effect?(setup: () => void | (() => void | Promise<void>)): unknown;
  systemPrompt?: {
    section(section: { name: string; order: number; text: string }): unknown;
    context(context: {
      name: string;
      order: number;
      text:
        | string
        | ((assembly: {
            agent?: {
              id: string;
              session: {
                header: {
                  cwd?: string;
                };
              };
            };
          }) => string);
    }): unknown;
  };
  logger?(name: string): {
    info?(...args: unknown[]): void;
    warn?(...args: unknown[]): void;
    error?(...args: unknown[]): void;
  };
}
