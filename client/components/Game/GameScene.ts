import { boardSize } from "common/game/const";
import {
    BoardPieceObject,
    BoardSide,
    Piece,
    oppositeSide,
} from "common/game/types";
import { assetName, piecePaths } from "components/Game/assets";
import Phaser from "phaser";
import { gameState, sceneInitiated, socket } from "signals";
import { Board } from "./Board";
import { themes } from "./colors";

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
            assetName(side, piece),
        ) as BoardPieceObject;
        newPiece.setInteractive();
        this.input.setDraggable(newPiece);
        return newPiece;
    }

    create() {
        const board = new Board({
            scene: this,
            maxQ: boardSize.q,
            maxR: boardSize.r,
            tileSize: 80,
            offsetX: 140,
            offsetY: 160,
            onMove: (move) => {
                socket.value?.sendMessage({ move: move });
                gameState.value = {
                    side: this.side!,
                    toMove: oppositeSide[this.side!],
                };
            },
        });

        socket.value?.addMessageHandler("initialSetup", (data) => {
            this.side = data.side;
            board.lockMovement = this.side !== data.toMove;
            gameState.value = { side: data.side, toMove: data.toMove };
            board.clear();
            data.pieces.forEach(({ side, piece, coords }) => {
                const newPiece = this.loadPiece(side, piece);
                board.addPiece(
                    newPiece,
                    piece,
                    side,
                    side === data.side,
                    coords,
                );
            });
            board.highlightChecks();
        });
        socket.value?.addMessageHandler("move", (data) => {
            board.removePiece(data.to.q, data.to.r);
            board.addHighlightedFields(
                themes["default"].highlights.moveTarget,
                [data.from, data.to],
            );
            if (data.promotion) {
                board.removePiece(data.from.q, data.from.r);
                const newPiece = this.loadPiece(
                    oppositeSide[this.side!],
                    data.promotion,
                );
                board.addPiece(
                    newPiece,
                    data.promotion,
                    oppositeSide[this.side!],
                    false,
                    data.to,
                );
            } else {
                board.movePiece(data);
            }
            board.highlightChecks();
            board.lockMovement = false;
            gameState.value = { side: this.side!, toMove: this.side! };
        });

        sceneInitiated.value = true;
    }
}
