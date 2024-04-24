import { repositoryURL } from "common/socketIO/const";
import { openClientSocket } from "common/socketIO/socket";
import Game from "components/Game";
import Lobby from "components/Lobby";
import Message from "components/Message";
import SideBar from "components/SideBar";
import { useEffect, useRef, useState } from "preact/hooks";
import {
    gameState,
    sceneInitiated,
    sendNotifications,
    socket,
    socketConnectionStatus,
} from "signals";
import styles from "./styles.module.css";
import { generateIdentity } from "./utils";
import Icon from "/assets/Chess_plt45.svg";
import GithubLogo from "/assets/github.svg";

const GithubLink = () => (
    <img
        src={GithubLogo}
        className={styles.githubLogo}
        onClick={() => window.open(repositoryURL)}
    />
);

export default function App() {
    const [gameRunning, setGameRunning] = useState(false);
    const [waitingForLobby, setWaitingForLobby] = useState(false);
    const docTitleRot = useRef<number>(0);
    const titleInterval = useRef<Timer>();

    useEffect(() => {
        document.addEventListener("visibilitychange", () => {
            clearInterval(titleInterval.current);
            document.title = "0xChess";
        });
        sendNotifications.value =
            localStorage["sendNotifications"] === "true" || false;

        const clientSocket = openClientSocket(() => {
            socketConnectionStatus.value = WebSocket.OPEN;
        });
        clientSocket.addMessageHandler("initialSetup", () => {
            setGameRunning(true);
        });
        clientSocket.addMessageHandler("move", () => {
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
        clientSocket.addMessageHandler("gameStatus", (status) => {
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

        clientSocket.addCloseHandler(() => {
            socketConnectionStatus.value = WebSocket.CLOSED;
            const reconnect = setInterval(() => {
                if (socketConnectionStatus.value === WebSocket.OPEN)
                    clearInterval(reconnect);
                else clientSocket.connect();
            }, 5000);
        });

        socket.value = clientSocket;
    }, []);

    useEffect(() => {
        if (
            socketConnectionStatus.value === WebSocket.OPEN &&
            sceneInitiated.value
        ) {
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
    }, [socketConnectionStatus.value, sceneInitiated.value]);

    return (
        <>
            <Game />
            {socketConnectionStatus.value === WebSocket.OPEN ? (
                gameRunning && !waitingForLobby ? (
                    <SideBar
                        onLeaveGame={() => {
                            setGameRunning(false);
                        }}
                    />
                ) : (
                    <>
                        <Lobby setKeepOpen={setWaitingForLobby} />
                        <GithubLink />
                    </>
                )
            ) : (
                <>
                    <Message text="connecting to socket..." />
                    <GithubLink />
                </>
            )}
        </>
    );
}
