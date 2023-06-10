import { showDialog } from "components/Game/gamestate";
import { getLegalMoves, promotionCoords } from "game/Pieces";
import {
    BoardCoordinates,
    BoardPieceObject,
    BoardSide,
    Move,
    Piece,
    sideFactor,
} from "game/types";
import Phaser from "phaser";
import { GameScene } from "./GameScene";

type Hexagon = Phaser.GameObjects.Polygon &
    BoardCoordinates & { defaultColor: number };

function createHexagon(
    scene: Phaser.Scene,
    {
        size,
        x,
        y,
        color,
        q,
        r,
    }: { size: number; x: number; y: number; color: number } & BoardCoordinates
) {
    const width = Math.sqrt(3) * size;
    const height = 2 * size;
    const geom = new Phaser.Geom.Polygon([
        new Phaser.Math.Vector2(0 * width, 0.5 * height),
        new Phaser.Math.Vector2(-0.5 * width, 0.25 * height),
        new Phaser.Math.Vector2(-0.5 * width, -0.25 * height),
        new Phaser.Math.Vector2(0 * width, -0.5 * height),
        new Phaser.Math.Vector2(0.5 * width, -0.25 * height),
        new Phaser.Math.Vector2(0.5 * width, 0.25 * height),
    ]);
    const hexagon = scene.add
        .polygon(x, y, geom.points, color)
        .setInteractive(geom, Phaser.Geom.Polygon.Contains, true)
        .on(Phaser.Input.Events.POINTER_DOWN, () =>
            console.log(q, r)
        ) as Hexagon;
    hexagon.q = q;
    hexagon.r = r;
    hexagon.defaultColor = color;
    return hexagon;
}

function hexToPixel(size: number, { q, r }: { q: number; r: number }) {
    const x = size * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
    const y = size * ((3 / 2) * r);
    return { x, y };
}

export class Board {
    private scene: GameScene;
    private onMove: (move: Move) => void;

    public fields: Hexagon[][] = [];

    public maxQ: number;
    public maxR: number;
    public offsetQ: number;
    public offsetR: number;

    public pieces: BoardPieceObject[] = [];
    public highlightedFields: BoardCoordinates[] = [];

    public lockMovement = false;
    public gameOver = false;

    constructor({
        scene,
        maxQ,
        maxR,
        tileSize,
        offsetX,
        offsetY,
        onMove,
    }: {
        scene: GameScene;
        maxQ: number;
        maxR: number;
        tileSize: number;
        offsetX: number;
        offsetY: number;
        onMove: (move: Move) => void;
    }) {
        this.scene = scene;
        this.maxQ = maxQ;
        this.maxR = maxR;
        this.offsetR = Math.floor(maxR / 2);
        this.offsetQ = Math.floor(maxQ / 2) - this.offsetR / 2;
        this.onMove = onMove;
        for (let r = 0; r < maxR; r++) {
            this.fields[r] = [];
            for (let q = 0; q < maxQ - (r % 2); q++) {
                const qAxial = Math.ceil(q - r / 2);
                const { x, y } = hexToPixel(tileSize, {
                    q: qAxial,
                    r,
                });
                const hexagon = createHexagon(scene, {
                    size: tileSize,
                    x: x + offsetX,
                    y: y + offsetY,
                    color: [0xd18b47, 0xeeaa66, 0xffcc99][
                        (q - (r % 2) + 3) % 3
                    ]!,
                    q: qAxial - this.offsetQ,
                    r: r - this.offsetR,
                });
                hexagon.isStroked = true;
                hexagon.strokeColor = 0x000000;
                this.fields[r]?.push(hexagon);
            }
        }
    }

    private getField(q: number, r: number) {
        const selR = r + this.offsetR;
        const selQ = q + this.offsetQ + Math.floor(selR / 2);
        return this.fields[selR]?.[selQ];
    }

    public placePiece(
        piece: Phaser.GameObjects.Components.Transform &
            Phaser.GameObjects.Components.Size &
            BoardCoordinates,
        q: number,
        r: number
    ) {
        const field = this.getField(q, r);
        if (!field) return;
        piece.q = q;
        piece.r = r;
        piece.x = field.x - field.width / 2;
        piece.y = field.y - field.height / 2;
    }

    public addPiece(
        piece: BoardPieceObject,
        type: Piece,
        side: BoardSide,
        active: boolean,
        { q, r }: { q: number; r: number }
    ) {
        piece.q = q;
        piece.r = r;
        piece.piece = type;
        piece.side = side;

        this.pieces.push(piece);

        if (active) {
            piece
                .on(
                    Phaser.Input.Events.DRAG,
                    (pointer: Phaser.Input.Pointer, x: number, y: number) => {
                        piece.x = x;
                        piece.y = y;
                    }
                )
                .on(Phaser.Input.Events.DRAG_START, () => {
                    if (this.gameOver) return;
                    this.highlightedFields = getLegalMoves(
                        type,
                        side,
                        {
                            q: piece.q,
                            r: piece.r,
                        },
                        this.pieces.map((piece) => ({
                            side: piece.side,
                            piece: piece.piece,
                            coords: { q: piece.q, r: piece.r },
                        }))
                    );
                    this.highlightedFields.forEach(({ q, r }) => {
                        const field = this.getField(q, r);
                        if (!field) return;
                        field.fillColor = 0x00ff00;
                    });
                })
                .on(Phaser.Input.Events.DRAG_END, () => {
                    this.highlightedFields.forEach(({ q, r }) => {
                        const field = this.getField(q, r);
                        if (!field) return;
                        field.fillColor = field.defaultColor;
                    });
                    this.highlightedFields = [];
                    this.placePiece(piece, piece.q, piece.r);
                })
                .on(
                    Phaser.Input.Events.DRAG_ENTER,
                    (pointer: Phaser.Input.Pointer, hexagon: Hexagon) => {
                        if (piece.q !== hexagon.q || piece.r !== hexagon.r)
                            hexagon.fillColor = 0x757575;
                    }
                )
                .on(
                    Phaser.Input.Events.DRAG_LEAVE,
                    (pointer: Phaser.Input.Pointer, hexagon: Hexagon) => {
                        hexagon.fillColor = this.highlightedFields.some(
                            (field) =>
                                field.q === hexagon.q && field.r === hexagon.r
                        )
                            ? 0x00ff00
                            : hexagon.defaultColor;
                        hexagon.fillAlpha = 1;
                    }
                )
                .on(
                    Phaser.Input.Events.DROP,
                    (pointer: Phaser.Input.Pointer, dropZone: Hexagon) => {
                        dropZone.fillColor = dropZone.defaultColor;
                        dropZone.fillAlpha = 1;
                        if (
                            this.lockMovement ||
                            !this.highlightedFields.some(
                                (coord) =>
                                    coord.q === dropZone.q &&
                                    coord.r === dropZone.r
                            )
                        )
                            return;
                        this.lockMovement = true;
                        const takenPiece = this.pieces.find(
                            (piece) =>
                                piece.q === dropZone.q && piece.r === dropZone.r
                        );
                        if (takenPiece?.piece === "king") {
                            this.gameOver = true;
                        }
                        this.removePiece(dropZone.q, dropZone.r);
                        if (
                            piece.piece == "pawn" &&
                            promotionCoords.some(
                                (coord) =>
                                    coord.q * sideFactor[side] === dropZone.q &&
                                    coord.r * sideFactor[side] === dropZone.r
                            )
                        ) {
                            this.removePiece(piece.q, piece.r);
                            showDialog.value = {
                                side,
                                callBack: (newPiece) => {
                                    showDialog.value = undefined;
                                    this.onMove({
                                        from: { q: piece.q, r: piece.r },
                                        to: {
                                            q: dropZone.q,
                                            r: dropZone.r,
                                        },
                                        promotion: newPiece,
                                    });
                                    const boardPiece = this.scene.loadPiece(
                                        side,
                                        newPiece
                                    );
                                    this.addPiece(
                                        boardPiece,
                                        newPiece,
                                        side,
                                        true,
                                        { q: dropZone.q, r: dropZone.r }
                                    );
                                },
                            };
                        } else {
                            this.onMove({
                                from: { q: piece.q, r: piece.r },
                                to: { q: dropZone.q, r: dropZone.r },
                            });
                            this.placePiece(piece, dropZone.q, dropZone.r);
                        }
                    }
                );
            this.scene.input.setDraggable(piece);
        }
        this.placePiece(piece, q, r);
    }

    public removePiece(q: number, r: number) {
        this.pieces.find((piece) => piece.q === q && piece.r === r)?.destroy();
        this.pieces = this.pieces.filter(
            (piece) => !(piece.q === q && piece.r === r)
        );
    }
}
