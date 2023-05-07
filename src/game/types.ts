import Phaser from "phaser";

export type Piece = "king" | "queen" | "rook" | "bishop" | "knight" | "pawn";

export const boardSides = ["white", "black"] as const;
export type BoardSide = typeof boardSides[number];

export const sideFactor: { [key in BoardSide]: number } = {
    white: 1,
    black: -1,
};

export const oppositeSide = { white: "black", black: "white" } as const;

export type BoardPiece = {
    side: BoardSide;
    piece: Piece;
    coords: BoardCoordinates;
};

export type BoardCoordinates = { q: number; r: number };
export type BoardPieceObject = Phaser.GameObjects.Image &
    BoardCoordinates & { side: BoardSide; piece: Piece };
