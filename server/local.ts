import { createServer, type Server } from "node:http";
import { pathToFileURL } from "node:url";
import { loadServerConfig, type ServerConfig } from "./config.js";
import { createApplicationHandler } from "./composition.js";

export function createLocalServer(config: ServerConfig): Server {
  return createServer(createApplicationHandler(config));
}
export function startLocalServer(env: NodeJS.ProcessEnv = process.env): Server {
  const port = env.PORT ?? "3001";
  if (!/^[0-9]+$/.test(port) || Number(port) > 65535)
    throw new Error("Invalid server port");
  const server = createLocalServer(loadServerConfig(env));
  server.listen(Number(port), "127.0.0.1");
  return server;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  startLocalServer();
