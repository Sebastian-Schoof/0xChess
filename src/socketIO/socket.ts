import { getLegalMoves, initialBoardSetup, promotionCoords } from "game/Pieces";
import { BoardPiece, BoardSide, boardSides, oppositeSide } from "game/types";
import type { SocketMessage } from "socketIO/types";
import { WebSocket } from "ws";

const games: ({
    connections: { [side in BoardSide]?: WebSocket };
    state: { pieces: BoardPiece[]; toMove: BoardSide };
} | null)[] = [];

function joinGame(socket: WebSocket) {
    for (let gameId = 0; gameId < games.length; gameId++) {
        if (!games[gameId]) continue;
        for (let side of boardSides)
            if (games[gameId]!.connections[side] === undefined) {
                games[gameId]!.connections[side] = socket;
                return [side, gameId] as const;
            }
    }

    const side = boardSides[Math.floor(Math.random() * 2)]!;
    let gameId = games.indexOf(null);
    if (gameId == -1) {
        gameId = games.length;
    }
    games[gameId] = {
        connections: { [side]: socket },
        state: { pieces: initialBoardSetup, toMove: "white" },
    };
    return [side, gameId] as const;
}

function closeGame(gameId: number) {
    boardSides.forEach((side) => games[gameId]?.connections[side]?.close());
    games[gameId] = null;
}

export function run(port: number) {
    const wss = new WebSocket.Server({ port });
    wss.on("connection", function (ws) {
        const [side, gameId] = joinGame(ws);
        const initialSetupMessage: SocketMessage = {
            type: "initialSetup",
            data: {
                side,
                pieces: games[gameId]!.state.pieces,
                toMove: games[gameId]!.state.toMove,
            },
        };
        ws.send(JSON.stringify(initialSetupMessage));

        ws.on("message", function (message) {
            if (side !== games[gameId]!.state.toMove) {
                closeGame(gameId);
                return;
            }
            games[gameId]!.state.toMove = oppositeSide[side];
            let parsedMessage: SocketMessage;
            try {
                parsedMessage = JSON.parse(message as any) as SocketMessage;
                if (parsedMessage?.type !== "move") {
                    closeGame(gameId);
                    return;
                }
            } catch {
                closeGame(gameId);
                return;
            }
            const movingPiece = games[gameId]!.state.pieces.find(
                (piece) =>
                    parsedMessage?.type === "move" && //TODO: remove typing related runtime overhead
                    piece.side === side &&
                    piece.coords.q === parsedMessage.data.from.q &&
                    piece.coords.r === parsedMessage.data.from.r
            );
            if (!movingPiece) {
                closeGame(gameId);
                return;
            }
            const legalMoves = getLegalMoves(
                movingPiece.piece,
                side,
                parsedMessage.data.from,
                games[gameId]!.state.pieces
            );
            if (
                !legalMoves.some(
                    ({ q, r }) =>
                        parsedMessage?.type === "move" && //TODO: remove typing related runtime overhead
                        r === parsedMessage.data.to.r &&
                        q === parsedMessage.data.to.q
                )
            ) {
                closeGame(gameId);
                return;
            }
            const promotionPiece = parsedMessage.data.promotion;
            const movedOntoPromotion = promotionCoords.some(
                ({ q, r }) =>
                    parsedMessage?.type === "move" && //TODO: remove typing related runtime overhead
                    q === parsedMessage.data.to.q &&
                    r === parsedMessage.data.to.r
            );
            if (
                (promotionPiece && !movedOntoPromotion) ||
                (movedOntoPromotion && !promotionPiece)
            ) {
                closeGame(gameId);
                return;
            }
            movingPiece.coords = parsedMessage.data.to;
            if (promotionPiece) movingPiece.piece = promotionPiece;
            games[gameId]?.connections[oppositeSide[side]]?.send(
                message.toString()
            );
        });

        ws.on("close", function () {
            games[gameId]?.connections[oppositeSide[side]]?.close();
            games[gameId] = null;
        });
    });
}
