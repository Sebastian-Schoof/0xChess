import Game from "components/Game";
import Lobby from "components/Lobby";
import { useEffect, useState } from "preact/hooks";
import { socket } from "./socket";
import { openClientSocket } from "socketIO/socket";

export function App() {
    const [startGame, setStartGame] = useState(false);
    useEffect(() => {
        const clientSocket = openClientSocket(() => {
            socket.value = clientSocket;
        });
    }, []);

    if (socket.value?.state === WebSocket.OPEN)
        socket.value.addMessageHandler("initialSetup", () => {
            setStartGame(true);
        });

    return socket.value?.state === WebSocket.OPEN ? (
        <>
            <Game />
            {!startGame && <Lobby />}
        </>
    ) : (
        <>connecting to socket...</>
    );
}
