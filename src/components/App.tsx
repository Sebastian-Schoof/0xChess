import Game from "components/Game";
import Lobby from "components/Lobby";
import SideBar from "components/SideBar";
import { useEffect, useState } from "preact/hooks";
import { openClientSocket } from "socketIO/socket";
import { gameState, sceneInitiated, socket } from "./signals";
import { generateIdentity } from "./utils";

export function App() {
    const [gameRunning, setGameRunning] = useState(false);

    useEffect(() => {
        const clientSocket = openClientSocket(() => {
            socket.value = clientSocket;
        });
    }, []);

    useEffect(() => {
        if (socket.value?.state === WebSocket.OPEN && sceneInitiated.value) {
            socket.value.addMessageHandler("initialSetup", () => {
                setGameRunning(true);
            });
            socket.value.addMessageHandler("gameStatus", (status) => {
                switch (status) {
                    case "won":
                    case "lost":
                        gameState.value = {
                            side: gameState.value!.side,
                            gameState: status,
                        };
                        break;
                    case "opponent quit":
                        alert("you oppent quit. make of that what you will");
                        break;
                }
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
            {gameRunning ? (
                <SideBar
                    onLeaveGame={() => {
                        setGameRunning(false);
                    }}
                />
            ) : (
                <Lobby />
            )}
        </>
    ) : (
        <>connecting to socket...</>
    );
}
