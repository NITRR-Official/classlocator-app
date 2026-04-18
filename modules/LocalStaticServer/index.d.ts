export interface LocalStaticServerStartOptions {
  rootPath: string;
  port?: number;
  localOnly?: boolean;
}

export function start(
  options?: LocalStaticServerStartOptions,
): Promise<string>;

export function stop(): Promise<void>;
