import Game from "components/Game";
import Lobby from "components/Lobby";
import { useEffect, useState } from "preact/hooks";
import { sceneInitiated, socket } from "./signals";
import { openClientSocket } from "socketIO/socket";
import { generateIdentity } from "./utils";

export function App() {
    const [startGame, setStartGame] = useState(false);

    useEffect(() => {
        const clientSocket = openClientSocket(() => {
            socket.value = clientSocket;
        });
    }, []);

    useEffect(() => {
        if (socket.value?.state === WebSocket.OPEN && sceneInitiated.value) {
            socket.value.addMessageHandler("initialSetup", () => {
                setStartGame(true);
            });
            (async () => {
                if (localStorage["identity"]) {
                    var identity = localStorage["identity"] as string;
                } else {
                    var identity = await generateIdentity();
                    localStorage["identity"] = identity;
                }
                socket.value?.sendMessage({ identity });
            })();
        }
    }, [socket.value?.state, sceneInitiated.value]);

    return socket.value?.state === WebSocket.OPEN ? (
        <>
            <Game />
            {!startGame && <Lobby />}
        </>
    ) : (
        <>connecting to socket...</>
    );
}
