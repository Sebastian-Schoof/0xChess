import { openServerSocket } from "common/socketIO/socket";
import { ServerState } from "state/serverState";
import { SessionStateManager } from "state/sessionStateManager";

function run() {
    const serverState = new ServerState();
    openServerSocket((ws) => {
        const sessionStateManager = new SessionStateManager(serverState, ws);
        sessionStateManager.start();

        ws.addCloseHandler(function () {
            sessionStateManager.cancel();
        });
    });
}

run();
console.log("server running");
