import { getLegalMoves } from "./Pieces";
import type {
    BoardCoordinates,
    BoardPieceObject,
    BoardSide,
    Piece,
} from "./types";

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
    private scene: Phaser.Scene;

    public fields: Hexagon[][] = [];
    // public defaultFieldColor = 0xaaaaaa;
    public maxQ: number;
    public maxR: number;
    public offsetQ: number;
    public offsetR: number;

    public pieces: BoardPieceObject[] = [];
    public highlightedFields: BoardCoordinates[] = [];

    constructor(
        scene: Phaser.Scene,
        maxQ: number,
        maxR: number,
        tileSize: number,
        offsetX: number,
        offsetY: number
    ) {
        this.scene = scene;
        this.maxQ = maxQ;
        this.maxR = maxR;
        this.offsetR = Math.floor(maxR / 2);
        this.offsetQ = Math.floor(maxQ / 2) - this.offsetR / 2;
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
                    color: [0x769656, 0xeeeed2, 0xbaca44][
                        (q - (r % 2) + 3) % 3
                    ]!,
                    q: qAxial - this.offsetQ,
                    r: r - this.offsetR,
                });
                hexagon.isStroked = true;
                hexagon.strokeColor = 0xffffff;
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
        { q, r }: { q: number; r: number }
    ) {
        piece.q = q;
        piece.r = r;
        piece.piece = type;
        piece.side = side;

        this.pieces.push(piece);

        piece
            .on(
                Phaser.Input.Events.DRAG,
                (pointer: Phaser.Input.Pointer, x: number, y: number) => {
                    piece.x = x;
                    piece.y = y;
                }
            )
            .on(Phaser.Input.Events.DRAG_START, () => {
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
                        this.highlightedFields.some(
                            (coord) =>
                                coord.q === dropZone.q && coord.r === dropZone.r
                        )
                    )
                        this.placePiece(piece, dropZone.q, dropZone.r);
                }
            );
        this.scene.input.setDraggable(piece);
        this.placePiece(piece, q, r);
    }
}
