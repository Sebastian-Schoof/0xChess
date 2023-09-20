import { getLegalMoves, initialBoardSetup, promotionCoords } from "game/Pieces";
import { BoardPiece, BoardSide, boardSides, oppositeSide } from "game/types";
import { ServerSocket, openServerSocket } from "./socket";

class ServerState {
    private games: ({
        connections: { [side in BoardSide]?: ServerSocket };
        state: { pieces: BoardPiece[]; toMove: BoardSide };
        code?: string;
    } | null)[] = [];

    getGameById(gameId: number) {
        return this.games[gameId];
    }

    joinGame(socket: ServerSocket, code?: string) {
        for (let gameId = 0; gameId < this.games.length; gameId++) {
            if (!this.games[gameId]) continue;
            if (code && this.games[gameId]?.code !== code) continue;
            for (let side of boardSides)
                if (this.games[gameId]!.connections[side] === undefined) {
                    this.games[gameId]!.connections[side] = socket;
                    return [side, gameId] as const;
                }
        }

        const side = boardSides[Math.floor(Math.random() * 2)]!;
        let gameId = this.games.indexOf(null);
        if (gameId == -1) {
            gameId = this.games.length;
        }
        this.games[gameId] = {
            connections: { [side]: socket },
            state: {
                pieces: structuredClone(initialBoardSetup),
                toMove: "white",
            },
            code,
        };
        return [side, gameId] as const;
    }

    closeGame(gameId: number) {
        boardSides.forEach((side) =>
            this.games[gameId]?.connections[side]?.close()
        );
        this.games[gameId] = null;
    }
}

interface SessionState {
    enter: () => void;
    leave: () => void;
}

class SessionStateManager {
    private activeState: Matchmaking | Gameplay;
    public serverState: ServerState;
    public socket: ServerSocket;
    constructor(serverState: ServerState, socket: ServerSocket) {
        this.serverState = serverState;
        this.socket = socket;
        this.activeState = new Matchmaking(this);
    }

    start() {
        this.activeState.enter();
    }

    next(gameInfo?: readonly [BoardSide, number]) {
        this.activeState.leave();
        this.activeState = gameInfo
            ? new Gameplay(this, ...gameInfo)
            : new Matchmaking(this);
        this.activeState.enter();
    }

    cancel() {
        this.activeState.leave();
    }
}

const incrementToChar = (char: any, idx: number) =>
    String.fromCharCode(char + idx);
const friendCodeChars = new Array(10)
    .fill(48)
    .map(incrementToChar)
    .concat(new Array(26).fill(65).map(incrementToChar));
function generateFriendCode(length = 4) {
    const friendCode = new Array(length);
    for (let i = 0; i < length; i++) {
        const randomIdx = Math.floor(Math.random() * friendCodeChars.length);
        friendCode[i] = friendCodeChars[randomIdx];
    }
    return friendCode.join("");
}

class Matchmaking implements SessionState {
    constructor(private stateManager: SessionStateManager) {}

    public enter() {
        this.stateManager.socket.addMessageHandler(
            "requestGame",
            (opponent) => {
                let gameInfo: readonly [BoardSide, number] | undefined =
                    undefined;
                switch (opponent) {
                    case "friend":
                        const friendCode = generateFriendCode(4);
                        this.stateManager.socket.sendMessage({ friendCode });
                        gameInfo = this.stateManager.serverState.joinGame(
                            this.stateManager.socket,
                            friendCode
                        );
                        break;
                    case "random":
                        gameInfo = this.stateManager.serverState.joinGame(
                            this.stateManager.socket
                        );
                        break;
                }
                this.stateManager.next(gameInfo);
            }
        );
        this.stateManager.socket.addMessageHandler("joinGame", (friendCode) => {
            const gameInfo = this.stateManager.serverState.joinGame(
                this.stateManager.socket,
                friendCode
            );
            this.stateManager.next(gameInfo);
        });
    }

    public leave() {
        this.stateManager.socket.clearMessageHandler("requestGame");
        this.stateManager.socket.clearMessageHandler("joinGame");
    }
}

class Gameplay implements SessionState {
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
            game.connections[oppositeSide[this.side]]?.sendMessage({ move });
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
        this.gameId && this.stateManager.serverState.closeGame(this.gameId);
        this.stateManager.socket.clearMessageHandler("move");
    }
}

export function run() {
    const serverState = new ServerState();
    openServerSocket((ws) => {
        const sessionStateManager = new SessionStateManager(serverState, ws);
        sessionStateManager.start();

        ws.addCloseHandler(function () {
            sessionStateManager.cancel();
        });
    });
}
