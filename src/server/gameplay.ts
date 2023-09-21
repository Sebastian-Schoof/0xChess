import { getLegalMoves, promotionCoords } from "game/Pieces";
import { BoardSide, oppositeSide } from "game/types";
import { SessionStateManager } from "./sessionStateManager";
import { SessionState } from "./types";

export class Gameplay implements SessionState {
    constructor(
        private stateManager: SessionStateManager,
        private side: BoardSide,
        private gameId: number
    ) {}

    enter() {
        this.stateManager.socket.addMessageHandler("move", (move) => {
            const game = this.stateManager.serverState.getGameById(
                this.gameId!
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
                    piece.coords.r === move.from.r
            );
            if (!movingPiece) {
                this.stateManager.serverState.closeGame(this.gameId!);
                return;
            }
            const legalMoves = getLegalMoves(
                movingPiece.piece,
                this.side,
                move.from,
                game.state.pieces
            );
            if (
                !legalMoves.some(
                    ({ q, r }) => r === move.to.r && q === move.to.q
                )
            ) {
                this.stateManager.serverState.closeGame(this.gameId!);
                return;
            }
            const promotionPiece = move.promotion;
            const movedOntoPromotion = promotionCoords.some(
                ({ q, r }) => q === move.to.q && r === move.to.r
            );
            if (
                (promotionPiece && !movedOntoPromotion) ||
                (movedOntoPromotion && !promotionPiece)
            ) {
                this.stateManager.serverState.closeGame(this.gameId!);
                return;
            }
            movingPiece.coords = move.to;
            if (promotionPiece) movingPiece.piece = promotionPiece;
            game.connections[oppositeSide[this.side]]?.socket?.sendMessage({
                move,
            });
            //TODO: check for mate
        });

        const joinedGame = this.stateManager.serverState.getGameById(
            this.gameId
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
                this.stateManager.userId
            );
        this.stateManager.socket.clearMessageHandler("move");
    }
}
