import Game from "components/Game";
import Lobby from "components/Lobby";
import SideBar from "components/SideBar";
import { useEffect, useRef, useState } from "preact/hooks";
import { openClientSocket } from "socketIO/socket";
import {
    gameState,
    sceneInitiated,
    sendNotifications,
    socket,
} from "./signals";
import { generateIdentity } from "./utils";
import Icon from "/assets/Chess_plt45.svg";

export function App() {
    const [gameRunning, setGameRunning] = useState(false);
    const docTitleRot = useRef<number>(0);
    const titleInterval = useRef<NodeJS.Timer>();

    useEffect(() => {
        const clientSocket = openClientSocket(() => {
            socket.value = clientSocket;
        });
        sendNotifications.value =
            localStorage["sendNotifications"] === "true" || false;
    }, []);

    useEffect(() => {
        if (socket.value?.state === WebSocket.OPEN && sceneInitiated.value) {
            socket.value.addMessageHandler("initialSetup", () => {
                setGameRunning(true);
            });
            socket.value.addMessageHandler("move", () => {
                if (document.visibilityState !== "visible") {
                    document.title = "your move";
                    titleInterval.current = setInterval(() => {
                        document.title =
                            "your move" +
                            new Array(docTitleRot.current).fill(".").join("");
                        docTitleRot.current = (docTitleRot.current + 1) % 4;
                    }, 1000);
                    if (
                        sendNotifications.value &&
                        Notification?.permission === "granted"
                    )
                        new Notification("your move", { icon: Icon });
                }
            });
            document.addEventListener("visibilitychange", () => {
                clearInterval(titleInterval.current);
                document.title = "0xChess";
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
