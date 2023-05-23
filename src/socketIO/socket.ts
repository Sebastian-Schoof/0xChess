import { initialBoardSetup } from "game/Pieces";
import { BoardSide, boardSides, oppositeSide } from "game/types";
import type { SocketMessage } from "socketIO/types";
import { WebSocket } from "ws";

const games: ({ [side in BoardSide]?: WebSocket } | null)[] = [];

function joinGame(socket: WebSocket) {
    for (let gameId = 0; gameId < games.length; gameId++) {
        if (!games[gameId]) continue;
        for (let side of boardSides)
            if (games[gameId]![side] === undefined) {
                games[gameId]![side] = socket;
                return [side, gameId] as const;
            }
    }

    const side = boardSides[Math.floor(Math.random() * 2)]!;
    let gameId = games.indexOf(null);
    if (gameId == -1) {
        gameId = games.length;
    }
    games[gameId] = { [side]: socket };
    return [side, gameId] as const;
}

export function run(port: number) {
    const wss = new WebSocket.Server({ port });
    wss.on("connection", function (ws) {
        const [side, gameId] = joinGame(ws);
        const initialSetupMessage: SocketMessage = {
            type: "initialSetup",
            data: { side, pieces: initialBoardSetup },
        };
        ws.send(JSON.stringify(initialSetupMessage));

        ws.on("message", function (message) {
            games[gameId]?.[oppositeSide[side]]?.send(message.toString());
        });

        ws.on("close", function () {
            games[gameId]?.[oppositeSide[side]]?.close();
            games[gameId] = null;
        });
    });
}
