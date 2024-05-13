import { getLegalMoves, isInCheck, promotionCoords } from "common/game/Pieces";
import {
    BoardCoordinates,
    BoardPieceObject,
    BoardSide,
    Move,
    Piece,
    boardSides,
    sideFactor,
} from "common/game/types";
import { showDialog } from "components/Game/gamestate";
import Phaser from "phaser";
import { gameState } from "signals";
import { GameScene } from "./GameScene";
import { themes } from "./colors";

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
    }: { size: number; x: number; y: number; color: number } & BoardCoordinates,
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
        .setStrokeStyle(2)
        .setInteractive(geom, Phaser.Geom.Polygon.Contains, true) as Hexagon;
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

    private pieces: BoardPieceObject[] = [];
    private fields: Hexagon[][] = [];

    public maxQ: number;
    public maxR: number;
    public offsetQ: number;
    public offsetR: number;

    private highlightedPieces: {
        piece: BoardPieceObject;
        glow: Phaser.FX.Glow;
    }[] = [];
    public highlightedFields: ({
        color: number;
        coordinates: BoardCoordinates[];
    } | null)[] = [];

    private dragState: {
        legalDropCoordinates: BoardCoordinates[];
        allowedFieldsLayer: number;
        hoveredFieldLayer?: number;
    } | null = null;
    public lockMovement = false;

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
                    color: themes["default"].board[(q - (r % 2) + 3) % 3]!,
                    q: qAxial - this.offsetQ,
                    r: r - this.offsetR,
                });
                hexagon.isStroked = true;
                hexagon.strokeColor = themes["default"].stroke;
                this.fields[r]?.push(hexagon);
            }
        }
    }

    public getBoardPieces() {
        return this.pieces.map((piece) => ({
            side: piece.side,
            piece: piece.piece,
            coords: { q: piece.q, r: piece.r },
        }));
    }

    private getField(q: number, r: number) {
        const selR = r + this.offsetR;
        const selQ = q + this.offsetQ + Math.floor(selR / 2);
        return this.fields[selR]?.[selQ];
    }

    private updateFieldColors() {
        this.fields.forEach((fields) =>
            fields.forEach((field) => (field.fillColor = field.defaultColor)),
        );
        this.highlightedFields.forEach((highlight) =>
            highlight?.coordinates.forEach(({ q, r }) => {
                const field = this.getField(q, r);
                if (!field) return;
                field.fillColor = highlight.color;
            }),
        );
    }

    public setHighlightedFields(
        color: number,
        coordinates: BoardCoordinates[],
    ) {
        this.highlightedFields = [{ color, coordinates }];
        this.updateFieldColors();
        return this.highlightedFields.length - 1;
    }

    public addHighlightedFields(
        color: number,
        coordinates: BoardCoordinates[],
    ) {
        this.highlightedFields.push({ color, coordinates });
        this.updateFieldColors();
        return this.highlightedFields.length - 1;
    }

    public removeHighlightedFields(stage: number) {
        this.highlightedFields[stage] = null;
        this.updateFieldColors();
    }

    public clearHighlightedFields() {
        this.highlightedFields = [];
        this.updateFieldColors();
    }

    private highlightPiece(coordinates: BoardCoordinates) {
        const piece = this.pieces.find(
            (piece) => piece.q === coordinates.q && piece.r === coordinates.r,
        );
        const glow = piece?.postFX.addGlow(
            themes["default"].highlights.check,
            10,
        );
        if (piece && glow) this.highlightedPieces.push({ piece, glow });
    }

    private clearPieceHighlights() {
        this.highlightedPieces.forEach(({ piece, glow }) =>
            piece?.postFX.remove(glow),
        );
        this.highlightedPieces = [];
    }

    public highlightChecks() {
        this.clearPieceHighlights();
        boardSides.forEach((side) => {
            if (isInCheck(side, this.getBoardPieces())) {
                const kingCoordinates = this.getBoardPieces().find(
                    (piece) => piece.side === side && piece.piece === "king",
                )?.coords;
                if (kingCoordinates) this.highlightPiece(kingCoordinates);
            }
        });
    }

    private placePiece(
        piece: Phaser.GameObjects.Components.Transform &
            Phaser.GameObjects.Components.Size &
            BoardCoordinates,
        q: number,
        r: number,
    ) {
        const field = this.getField(q, r);
        if (!field) return;
        piece.q = q;
        piece.r = r;
        piece.x = field.x - field.width / 2;
        piece.y = field.y - field.height / 2;
    }

    public movePiece(move: Move) {
        this.placePiece(
            this.pieces.find(
                (piece) => piece.q === move.from.q && piece.r === move.from.r,
            )!,
            move.to.q,
            move.to.r,
        );
    }

    public addPiece(
        piece: BoardPieceObject,
        type: Piece,
        side: BoardSide,
        active: boolean,
        { q, r }: { q: number; r: number },
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
                    (_: Phaser.Input.Pointer, x: number, y: number) => {
                        piece.x = x;
                        piece.y = y;
                    },
                )
                .on(Phaser.Input.Events.DRAG_START, () => {
                    if (gameState.value && "gameState" in gameState.value)
                        return;
                    const legalMoves = getLegalMoves(
                        type,
                        side,
                        {
                            q: piece.q,
                            r: piece.r,
                        },
                        this.getBoardPieces(),
                        { q: this.maxQ, r: this.maxR },
                    );
                    const highlightedLayer = this.setHighlightedFields(
                        themes["default"].highlights.possibleMoves,
                        legalMoves,
                    );
                    this.dragState = {
                        legalDropCoordinates: legalMoves,
                        allowedFieldsLayer: highlightedLayer,
                    };
                })
                .on(Phaser.Input.Events.DRAG_END, () => {
                    this.clearHighlightedFields();
                    this.placePiece(piece, piece.q, piece.r);
                })
                .on(
                    Phaser.Input.Events.DRAG_ENTER,
                    (_: Phaser.Input.Pointer, hexagon: Hexagon) => {
                        if (
                            this.dragState &&
                            (piece.q !== hexagon.q || piece.r !== hexagon.r) &&
                            this.dragState.legalDropCoordinates.some(
                                (coordinate) =>
                                    coordinate.q === hexagon.q &&
                                    coordinate.r === hexagon.r,
                            )
                        ) {
                            const newHightlightLayer =
                                this.addHighlightedFields(
                                    themes["default"].highlights.moveTarget,
                                    [hexagon],
                                );
                            this.dragState.hoveredFieldLayer =
                                newHightlightLayer;
                        }
                    },
                )
                .on(
                    Phaser.Input.Events.DRAG_LEAVE,
                    (_: Phaser.Input.Pointer) => {
                        if (this.dragState?.hoveredFieldLayer) {
                            this.removeHighlightedFields(
                                this.dragState.hoveredFieldLayer,
                            );
                            this.dragState.hoveredFieldLayer = undefined;
                        }
                    },
                )
                .on(
                    Phaser.Input.Events.DROP,
                    (_: Phaser.Input.Pointer, dropZone: Hexagon) => {
                        if (
                            this.lockMovement ||
                            !this.dragState?.legalDropCoordinates.some(
                                (coord) =>
                                    coord.q === dropZone.q &&
                                    coord.r === dropZone.r,
                            )
                        ) {
                            if (this.dragState?.allowedFieldsLayer)
                                this.removeHighlightedFields(
                                    this.dragState.allowedFieldsLayer,
                                );
                            this.dragState = null;
                            return;
                        }
                        this.clearHighlightedFields();
                        this.dragState = null;
                        this.lockMovement = true;
                        this.removePiece(dropZone.q, dropZone.r);
                        if (
                            piece.piece == "pawn" &&
                            promotionCoords.some(
                                (coord) =>
                                    coord.q * -sideFactor[side] ===
                                        dropZone.q &&
                                    coord.r * -sideFactor[side] === dropZone.r,
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
                                        newPiece,
                                    );
                                    this.addPiece(
                                        boardPiece,
                                        newPiece,
                                        side,
                                        true,
                                        { q: dropZone.q, r: dropZone.r },
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
                        this.highlightChecks();
                    },
                );
            this.scene.input.setDraggable(piece);
        } else {
            piece.on(Phaser.Input.Events.POINTER_DOWN, () => {
                const movesHighlightLayer = this.addHighlightedFields(
                    themes["default"].highlights.possibleMoves,
                    getLegalMoves(
                        type,
                        side,
                        { q: piece.q, r: piece.r },
                        this.getBoardPieces(),
                        { q: this.maxQ, r: this.maxR },
                    ),
                );
                const pointerEvent = () => {
                    this.removeHighlightedFields(movesHighlightLayer);
                    this.scene.input.removeListener(
                        Phaser.Input.Events.POINTER_UP,
                    );
                    this.scene.input.removeListener(
                        Phaser.Input.Events.POINTER_UP_OUTSIDE,
                    );
                };
                this.scene.input.addListener(
                    Phaser.Input.Events.POINTER_UP,
                    pointerEvent,
                );
                this.scene.input.addListener(
                    Phaser.Input.Events.POINTER_UP_OUTSIDE,
                    pointerEvent,
                );
            });
        }
        this.placePiece(piece, q, r);
    }

    public removePiece(q: number, r: number) {
        this.pieces.find((piece) => piece.q === q && piece.r === r)?.destroy();
        this.pieces = this.pieces.filter(
            (piece) => !(piece.q === q && piece.r === r),
        );
    }

    public clear() {
        this.clearHighlightedFields();
        this.clearPieceHighlights();
        this.pieces.forEach((piece) => this.removePiece(piece.q, piece.r));
    }
}
