import { assetName, piecePaths } from "components/Game/assets";
import { BoardPieceObject, BoardSide, Piece, oppositeSide } from "game/types";
import Phaser from "phaser";
import { defaultPort } from "socketIO/const";
import type { SocketMessage } from "socketIO/types";
import { Board } from "./Board";

export class GameScene extends Phaser.Scene {
    private side?: BoardSide;

    private loadAsset(side: BoardSide, piece: Piece) {
        this.load.svg(assetName(side, piece), piecePaths[side][piece], {
            scale: 2,
        });
    }

    constructor(config: string | Phaser.Types.Scenes.SettingsConfig) {
        super(config);
    }

    preload() {
        this.loadAsset("white", "king");
        this.loadAsset("black", "king");
        this.loadAsset("white", "queen");
        this.loadAsset("black", "queen");
        this.loadAsset("white", "rook");
        this.loadAsset("black", "rook");
        this.loadAsset("white", "bishop");
        this.loadAsset("black", "bishop");
        this.loadAsset("white", "knight");
        this.loadAsset("black", "knight");
        this.loadAsset("white", "pawn");
        this.loadAsset("black", "pawn");
    }

    loadPiece(side: BoardSide, piece: Piece) {
        const newPiece = this.add.image(
            0,
            0,
            assetName(side, piece)
        ) as BoardPieceObject;
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
            maxQ: 9,
            maxR: 9,
            tileSize: 80,
            offsetX: 140,
            offsetY: 160,
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
