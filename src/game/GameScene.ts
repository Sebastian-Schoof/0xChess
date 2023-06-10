import { assetName, piecePaths } from "components/Game/assets";
import Phaser from "phaser";
import { defaultPort } from "socketIO/const";
import type { SocketMessage } from "socketIO/types";
import { Board } from "./Board";
import { BoardPieceObject, BoardSide, Piece, oppositeSide } from "./types";

export class GameScene extends Phaser.Scene {
    private side?: BoardSide;

    constructor(config: string | Phaser.Types.Scenes.SettingsConfig) {
        super(config);
    }

    preload() {
        this.load.image(assetName("white", "king"), piecePaths.white.king);
        this.load.image(assetName("black", "king"), piecePaths.black.king);
        this.load.image(assetName("white", "queen"), piecePaths.white.queen);
        this.load.image(assetName("black", "queen"), piecePaths.black.queen);
        this.load.image(assetName("white", "rook"), piecePaths.white.rook);
        this.load.image(assetName("black", "rook"), piecePaths.black.rook);
        this.load.image(assetName("white", "bishop"), piecePaths.white.bishop);
        this.load.image(assetName("black", "bishop"), piecePaths.black.bishop);
        this.load.image(assetName("white", "knight"), piecePaths.white.knight);
        this.load.image(assetName("black", "knight"), piecePaths.black.knight);
        this.load.image(assetName("white", "pawn"), piecePaths.white.pawn);
        this.load.image(assetName("black", "pawn"), piecePaths.black.pawn);
    }

    loadPiece(side: BoardSide, piece: Piece) {
        const newPiece = this.add.image(0, 0, side + piece) as BoardPieceObject;
        newPiece.scale = 0.5;
        newPiece.setInteractive();
        this.input.setDraggable(newPiece);
        return newPiece;
    }

    create() {
        const socket = new WebSocket(
            `ws://${window.location.hostname}:${
                process.env.PORT ?? defaultPort
            }`
        );
        const board = new Board({
            scene: this,
            maxQ: 13,
            maxR: 9,
            tileSize: 20,
            offsetX: 50,
            offsetY: 55,
            onMove: (move) => {
                const socketMessage: SocketMessage = {
                    type: "move",
                    data: move,
                };
                socket.send(JSON.stringify(socketMessage));
            },
        });

        socket.addEventListener("message", (event) => {
            const message = JSON.parse(event.data) as SocketMessage;
            switch (message.type) {
                case "initialSetup":
                    this.side = message.data.side;
                    if (this.side !== message.data.toMove)
                        board.lockMovement = true;
                    alert("you will play " + this.side);
                    message.data.pieces.forEach(({ side, piece, coords }) => {
                        const newPiece = this.loadPiece(side, piece);
                        board.addPiece(
                            newPiece,
                            piece,
                            side,
                            side === message.data.side,
                            coords
                        );
                    });
                    break;
                case "move":
                    const takenPiece = board.pieces.find(
                        (piece) =>
                            piece.q === message.data.to.q &&
                            piece.r === message.data.to.r
                    );
                    if (takenPiece?.piece === "king") {
                        board.gameOver = true;
                    }
                    board.removePiece(message.data.to.q, message.data.to.r);
                    if (message.data.promotion) {
                        board.removePiece(
                            message.data.from.q,
                            message.data.from.r
                        );
                        const newPiece = this.loadPiece(
                            oppositeSide[this.side!],
                            message.data.promotion
                        );
                        board.addPiece(
                            newPiece,
                            message.data.promotion,
                            oppositeSide[this.side!],
                            false,
                            message.data.to
                        );
                    } else {
                        board.placePiece(
                            board.pieces.find(
                                (piece) =>
                                    piece.q === message.data.from.q &&
                                    piece.r === message.data.from.r
                            )!,
                            message.data.to.q,
                            message.data.to.r
                        );
                    }
                    board.lockMovement = false;
                    break;
            }
        });
    }
}
