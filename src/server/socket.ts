import { initialBoardSetup } from "../game/Pieces";
import { BoardSide, boardSides, oppositeSide } from "../game/types";
import type { SocketMessage } from "../socketIO/types";
import { WebSocket } from "ws";

const games: ({ [side in BoardSide]?: WebSocket } | null)[] = [];

function joinGame(socket: WebSocket) {
    for (let gameId = 0; gameId < games.length; gameId++) {
        //TODO: catch game being null
        for (let side of boardSides)
            if (games[gameId]![side] === undefined) {
                games[gameId]![side] = socket;
                return [side, gameId] as const;
            }
    }
    const side = boardSides[Math.floor(Math.random() * 2)]!;
    //TODO: reuse null entries before creating new ones
    const gameId = games.length;
    games.push({ [side]: socket });
    return [side, gameId] as const;
}

export function run(port: number) {
    const wss = new WebSocket.Server({ port });
    wss.on("connection", function (ws) {
        const [side, gameId] = joinGame(ws);
        const initialSetupMessage: SocketMessage = {
            type: "initialSetup",
            //TODO: persist game state and account for whites first move
            //TODO: add sessions to make games resumable
            data: { side, pieces: initialBoardSetup },
        };
        ws.send(JSON.stringify(initialSetupMessage));

        ws.on("message", function (message) {
            //TODO: add validation
            //TODO: consolidate moves to enable wego
            //TODO: add winning condition (snatching the king)
            console.log(message.toString());
            games[gameId]?.[oppositeSide[side]]?.send(message.toString());
        });

        ws.on("close", function () {
            //TODO: handle close in client (maybe send a message)
            games[gameId]?.[oppositeSide[side]]?.close();
            games[gameId] = null;
        });
    });
}
