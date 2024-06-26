import {
    getLegalMoves,
    isInCheck,
    movePiece,
    promotionCoords,
} from "common/game/Pieces";
import { boardSize } from "common/game/const";
import { BoardSide, oppositeSide, sideFactor } from "common/game/types";
import { updateGame } from "db/interface/games";
import { SessionStateManager } from "./sessionStateManager";
import { SessionState } from "./types";

export class Gameplay implements SessionState {
    constructor(
        private stateManager: SessionStateManager,
        private side: BoardSide,
        private gameId: string,
    ) {}

    enter() {
        this.stateManager.socket.addMessageHandler("move", (move) => {
            const game = this.stateManager.serverState.getGameById(
                this.gameId!,
            );
            if (!game) {
                return;
            }
            if (this.side !== game.state.toMove) {
                this.stateManager.serverState.closeGame(this.gameId!);
                return;
            }
            game.state.toMove = oppositeSide[this.side];
            const movingPiece = game.state.pieces.find(
                (piece) =>
                    piece.side === this.side &&
                    piece.coords.q === move.from.q &&
                    piece.coords.r === move.from.r,
            );
            const capturedPiece = game.state.pieces.find(
                (piece) =>
                    piece.coords.q === move.to.q &&
                    piece.coords.r === move.to.r,
            );
            if (
                !movingPiece ||
                capturedPiece?.side === this.side ||
                capturedPiece?.piece === "king"
            ) {
                this.stateManager.serverState.closeGame(this.gameId!);
                return;
            }
            const legalMoves = getLegalMoves(
                movingPiece.piece,
                this.side,
                move.from,
                game.state.pieces,
                boardSize,
            );
            if (
                !legalMoves.some(
                    ({ q, r }) => r === move.to.r && q === move.to.q,
                )
            ) {
                this.stateManager.serverState.closeGame(this.gameId!);
                return;
            }
            const promotionPiece = move.promotion;
            const movedOntoPromotion = promotionCoords.some(
                ({ q, r }) =>
                    q * -sideFactor[this.side] === move.to.q &&
                    r * -sideFactor[this.side] === move.to.r,
            );
            const isPawn = movingPiece.piece === "pawn";
            if (
                (promotionPiece && (!movedOntoPromotion || !isPawn)) ||
                (isPawn && movedOntoPromotion && !promotionPiece)
            ) {
                this.stateManager.serverState.closeGame(this.gameId!);
                return;
            }
            game.state.pieces = movePiece(move, game.state.pieces);
            game.connections[oppositeSide[this.side]]?.socket?.sendMessage({
                move,
            });
            if (game.state.pieces.length <= 2) {
                game.connections[this.side]?.socket?.sendMessage({
                    gameStatus: "drew",
                });
                game.connections[oppositeSide[this.side]]?.socket?.sendMessage({
                    gameStatus: "drew",
                });
                this.stateManager.serverState.closeGame(this.gameId);
            } else if (
                isInCheck(oppositeSide[this.side], game.state.pieces) &&
                !game.state.pieces
                    .filter((piece) => piece.side === oppositeSide[this.side])
                    .some(
                        (piece) =>
                            getLegalMoves(
                                piece.piece,
                                oppositeSide[this.side],
                                piece.coords,
                                game.state.pieces,
                                boardSize,
                            ).length,
                    )
            ) {
                game.connections[this.side]?.socket?.sendMessage({
                    gameStatus: "won",
                });
                game.connections[oppositeSide[this.side]]?.socket?.sendMessage({
                    gameStatus: "lost",
                });
                this.stateManager.serverState.closeGame(this.gameId);
            } else updateGame(this.gameId, game.state.pieces);
        });

        this.stateManager.socket.addMessageHandler("gameStatus", (status) => {
            switch (status) {
                case "quit":
                    const game = this.stateManager.serverState.getGameById(
                        this.gameId!,
                    );
                    game?.connections[
                        oppositeSide[this.side]
                    ]?.socket?.sendMessage({ gameStatus: "opponent quit" });
                    this.stateManager.serverState.closeGame(this.gameId);
                    this.stateManager.next();
            }
        });

        const joinedGame = this.stateManager.serverState.getGameById(
            this.gameId,
        )!;
        this.stateManager.socket.sendMessage({
            initialSetup: {
                side: this.side,
                pieces: joinedGame.state.pieces,
                toMove: joinedGame.state.toMove,
            },
        });
    }

    leave() {
        this.gameId &&
            this.stateManager.userId &&
            this.stateManager.serverState.leaveGame(
                this.gameId,
                this.stateManager.userId,
            );
        this.stateManager.socket.clearMessageHandler("move");
        this.stateManager.socket.clearMessageHandler("gameStatus");
    }
}
