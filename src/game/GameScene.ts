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
import { initialSetup } from "./Pieces";
import { BoardPieceObject, boardSides, sideFactor } from "./types";

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
        const board = new Board(this, 13, 9, 20, 50, 55);
        initialSetup.forEach(([pieceName, { q, r }]) =>
            boardSides.forEach((side) => {
                const image = this.add.image(
                    0,
                    0,
                    pieceName + side[0]?.toUpperCase() + side.slice(1)
                ) as BoardPieceObject;
                image.scale = 0.5;
                image.setInteractive();
                this.input.setDraggable(image);
                board.addPiece(image, pieceName, side, {
                    q: q * sideFactor[side],
                    r: r * sideFactor[side],
                });
            })
        );
    }
}
