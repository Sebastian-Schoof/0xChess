import { readFileSync } from "node:fs";
import { createServer } from "node:https";
import { join } from "node:path";
import { WebSocketServer } from "ws";
import { defaultPort } from "common/socketIO/const";
import { Socket, type ServerSocket } from "common/socketIO/socket";

export function openServerSocket(onConnect: (ws: ServerSocket) => void) {
    const port = Number(process.env.VITE_PORT) || defaultPort;
    const certFolder = process.env.certFolder;
    const server = certFolder
        ? createServer({
              cert: readFileSync(join(certFolder, "fullchain.pem")),
              key: readFileSync(join(certFolder, "privkey.pem")),
          })
        : undefined;
    const wss = new WebSocketServer({
        port: server ? undefined : port,
        server,
    });

    wss.on("connection", (ws) =>
        onConnect(new Socket({ type: "server", connection: ws })),
    );
    server?.listen(port);
}
