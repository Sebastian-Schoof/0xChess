import Phaser from "phaser";
import { Board } from "./Board";
import kingWhite from "/assets/Chess_klt45.svg";
import kingBlack from "/assets/Chess_kdt45.svg";
import queenWhite from "/assets/Chess_qlt45.svg";
import queenBlack from "/assets/Chess_qdt45.svg";
import rookWhite from "/assets/Chess_rlt45.svg";
import rookBlack from "/assets/Chess_rdt45.svg";
import bishopWhite from "/assets/Chess_blt45.svg";
import bishopBlack from "/assets/Chess_bdt45.svg";
import knightWhite from "/assets/Chess_nlt45.svg";
import knightBlack from "/assets/Chess_ndt45.svg";
import pawnWhite from "/assets/Chess_plt45.svg";
import pawnBlack from "/assets/Chess_pdt45.svg";
import { BoardPieceObject, boardSides } from "./types";
import type { SocketMessage } from "socketIO/types";

export class GameScene extends Phaser.Scene {
    constructor(config: string | Phaser.Types.Scenes.SettingsConfig) {
        super(config);
    }

    preload() {
        this.load.image("kingWhite", kingWhite);
        this.load.image("kingBlack", kingBlack);
        this.load.image("queenWhite", queenWhite);
        this.load.image("queenBlack", queenBlack);
        this.load.image("rookWhite", rookWhite);
        this.load.image("rookBlack", rookBlack);
        this.load.image("bishopWhite", bishopWhite);
        this.load.image("bishopBlack", bishopBlack);
        this.load.image("knightWhite", knightWhite);
        this.load.image("knightBlack", knightBlack);
        this.load.image("pawnWhite", pawnWhite);
        this.load.image("pawnBlack", pawnBlack);
    }

    create() {
        fetch("http://localhost:3000/socket");
        const socket = new WebSocket("ws://localhost:8080");
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
                    console.log(message.data.side);
                    boardSides.forEach((side) =>
                        message.data.pieces[side].forEach(
                            ([pieceName, coords]) => {
                                const image = this.add.image(
                                    0,
                                    0,
                                    pieceName +
                                        side[0]?.toUpperCase() +
                                        side.slice(1)
                                ) as BoardPieceObject;
                                image.scale = 0.5;
                                image.setInteractive();
                                this.input.setDraggable(image);
                                board.addPiece(
                                    image,
                                    pieceName,
                                    side,
                                    side === message.data.side,
                                    coords
                                );
                            }
                        )
                    );
                    break;
                case "move":
                    board.removePiece(message.data[1].q, message.data[1].r);
                    board.placePiece(
                        board.pieces.find(
                            (piece) =>
                                piece.q === message.data[0].q &&
                                piece.r === message.data[0].r
                        )!,
                        message.data[1].q,
                        message.data[1].r
                    );
                    break;
            }
        });
    }
}
