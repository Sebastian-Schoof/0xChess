import type { APIRoute } from "astro";
import { initialBoardSetup } from "game/Pieces";
import { BoardSide, boardSides, oppositeSide } from "game/types";
import type { SocketMessage } from "socketIO/types";
import { WebSocket } from "ws";

export const get: APIRoute = () => {
    return new Response(null, { status: 200 });
};

const games: ({ [side in BoardSide]?: WebSocket } | null)[] = [];

function joinGame(socket: WebSocket) {
    for (let gameId = 0; gameId < games.length; gameId++) {
        for (let side of boardSides)
            if (games[gameId]![side] === undefined) {
                games[gameId]![side] = socket;
                return [side, gameId] as const;
            }
    }
    const side = boardSides[Math.floor(Math.random() * 2)]!;
    const gameId = games.length;
    games.push({ [side]: socket });
    return [side, gameId] as const;
}

const wss = new WebSocket.Server({ port: 8080 });
wss.on("connection", function (ws) {
    const [side, gameId] = joinGame(ws);
    const initialSetupMessage: SocketMessage = {
        type: "initialSetup",
        //TODO: persist game state and account for whites first move
        data: { side, pieces: initialBoardSetup },
    };
    ws.send(JSON.stringify(initialSetupMessage));

    ws.on("message", function (message) {
        //TODO: add validation
        console.log(message.toString());
        games[gameId]?.[oppositeSide[side]]?.send(message.toString());
    });

    ws.on("close", function () {
        games[gameId]?.[oppositeSide[side]]?.close();
        games[gameId] = null;
    });
});
