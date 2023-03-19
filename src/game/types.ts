import type { initialSetup } from "./Pieces";

export type Piece = typeof initialSetup[number][0];

export type BoardSide = "white" | "black";
export const boardSides: BoardSide[] = ["white", "black"];

export const sideFactor: { [key in BoardSide]: number } = {
    white: 1,
    black: -1,
};

export type BoardPiece = {
    side: BoardSide;
    piece: Piece;
    coords: BoardCoordinates;
};

export type BoardCoordinates = { q: number; r: number };
export type BoardPieceObject = Phaser.GameObjects.Image &
    BoardCoordinates & { side: BoardSide; piece: Piece };
