import { BoardSide } from "common/game/types";
import { ServerSocket } from "common/socketIO/socket";
import { Gameplay } from "./gameplay";
import { Matchmaking } from "./matchMaking";
import { ServerState } from "./serverState";

export class SessionStateManager {
    private activeState: Matchmaking | Gameplay;
    public serverState: ServerState;
    public userId: string | undefined;
    public socket: ServerSocket;
    constructor(serverState: ServerState, socket: ServerSocket) {
        this.serverState = serverState;
        this.socket = socket;
        this.activeState = new Matchmaking(this);
    }

    start() {
        this.activeState.enter();
    }

    next(gameInfo?: readonly [side: BoardSide, gameId: string]) {
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
