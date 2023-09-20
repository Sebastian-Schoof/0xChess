import { openServerSocket } from "socketIO/socket";
import { ServerState } from "./serverState";
import { SessionStateManager } from "./sessionStateManager";

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
