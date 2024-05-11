import { isOnBoard } from "./Board";
import { maxDiagonal, maxStaight } from "./const";
import {
    BoardCoordinates,
    BoardPiece,
    BoardSide,
    Move,
    Piece,
    boardSides,
    oppositeSide,
    sideFactor,
} from "./types";

const initialSetup: [Piece, BoardCoordinates][] = [
    ["king", { q: -4, r: 0 }],
    ["queen", { q: -3, r: -1 }],
    ["rook", { q: -2, r: -4 }],
    ["rook", { q: -6, r: 4 }],
    ["bishop", { q: -3, r: -2 }],
    ["bishop", { q: -3, r: 0 }],
    ["bishop", { q: -4, r: 1 }],
    ["knight", { q: -2, r: -3 }],
    ["knight", { q: -5, r: 2 }],
    ["knight", { q: -5, r: 3 }],
    ["pawn", { q: -1, r: -4 }],
    ["pawn", { q: -1, r: -3 }],
    ["pawn", { q: -2, r: -2 }],
    ["pawn", { q: -2, r: -1 }],
    ["pawn", { q: -2, r: 0 }],
    ["pawn", { q: -3, r: 1 }],
    ["pawn", { q: -4, r: 2 }],
    ["pawn", { q: -4, r: 3 }],
    ["pawn", { q: -5, r: 4 }],
];

const initialPawnSetup: BoardCoordinates[] = initialSetup
    .filter(([piece]) => piece === "pawn")
    .map(([, coords]) => coords);

export const initialBoardSetup: BoardPiece[] = boardSides.flatMap((side) =>
    initialSetup.flatMap(([piece, { q, r }]) => ({
        side,
        piece,
        coords: {
            q: q * sideFactor[side],
            r: r * sideFactor[side],
        },
    })),
);

export const promotionCoords: BoardCoordinates[] = [
    { q: -4, r: 0 },
    { q: -3, r: -1 },
    { q: -2, r: -4 },
    { q: -6, r: 4 },
    { q: -3, r: -2 },
    { q: -4, r: 1 },
    { q: -2, r: -3 },
    { q: -5, r: 2 },
    { q: -5, r: 3 },
];

const diagonalDirections = [
    { q: 1, r: -2 },
    { q: 2, r: -1 },
    { q: 1, r: 1 },
] as const;

const pawnDiagonals = [
    { q: 2, r: -1 },
    { q: 1, r: 1 },
] as const;

const straightDirections = [
    { q: 1, r: -1 },
    { q: 1, r: 0 },
    { q: 0, r: 1 },
] as const;

const knightDirections = [
    { q: 2, r: -3 },
    { q: 3, r: -2 },
    { q: 3, r: -1 },
    { q: 2, r: 1 },
    { q: 1, r: 2 },
    { q: -1, r: 3 },
];

function scaleCheck(
    coords: BoardCoordinates,
    side: BoardSide,
    boardPieces: BoardPiece[],
    directions: typeof diagonalDirections | typeof straightDirections,
    maxDirectionScale: number,
) {
    const legalFields = [] as BoardCoordinates[];
    for (const direction of [1, -1].flatMap((factor) =>
        directions.map((direction) => ({
            q: direction.q * factor,
            r: direction.r * factor,
        })),
    )) {
        let directionScale = 1;
        while (directionScale <= maxDirectionScale) {
            const targetField = {
                q: coords.q + direction.q * directionScale,
                r: coords.r + direction.r * directionScale,
            };
            const pieceOnTargetField = boardPieces.find(
                ({ coords: pieceCoords }) =>
                    pieceCoords.q === targetField.q &&
                    pieceCoords.r === targetField.r,
            );
            if (!pieceOnTargetField || pieceOnTargetField.side !== side)
                legalFields.push(targetField);
            if (pieceOnTargetField) break;
            directionScale++;
        }
    }
    return legalFields;
}

export const movePiece = (move: Move, boardPieces: BoardPiece[]) =>
    boardPieces
        .filter(
            (piece) =>
                !(piece.coords.q === move.to.q && piece.coords.r === move.to.r),
        )
        .map((piece) =>
            piece.coords.q === move.from.q && piece.coords.r === move.from.r
                ? {
                      side: piece.side,
                      coords: move.to,
                      piece: move.promotion ?? piece.piece,
                  }
                : piece,
        );

const legalMoves: {
    [key in Piece]: (
        coordinates: BoardCoordinates,
        side: BoardSide,
        boardPieces: BoardPiece[],
    ) => BoardCoordinates[];
} = {
    king: (coords, side, boardPieces) =>
        scaleCheck(coords, side, boardPieces, straightDirections, 1).concat(
            scaleCheck(coords, side, boardPieces, diagonalDirections, 1),
        ),
    queen: (coords, side, boardPieces) =>
        scaleCheck(
            coords,
            side,
            boardPieces,
            straightDirections,
            maxStaight,
        ).concat(
            scaleCheck(
                coords,
                side,
                boardPieces,
                diagonalDirections,
                maxDiagonal,
            ),
        ),
    rook: (coords, side, boardPieces) =>
        scaleCheck(coords, side, boardPieces, straightDirections, maxStaight),
    bishop: (coords, side, boardPieces) =>
        scaleCheck(coords, side, boardPieces, diagonalDirections, maxDiagonal),
    knight: (coords, side, boardPieces) => {
        const targets = [1, -1].flatMap((factor) =>
            knightDirections.map((direction) => ({
                q: coords.q + direction.q * factor,
                r: coords.r + direction.r * factor,
            })),
        );
        return targets.filter(
            (field) =>
                !boardPieces.some(
                    ({ side: pieceSide, coords }) =>
                        pieceSide === side &&
                        field.q === coords.q &&
                        field.r === coords.r,
                ),
        );
    },
    pawn: (coords, side, boardPieces) => {
        const range = initialPawnSetup.some(
            ({ q, r }) =>
                coords.q === sideFactor[side] * q &&
                coords.r === sideFactor[side] * r,
        )
            ? 2
            : 1;
        const legalFields = new Array(range);
        for (let idx = 0; idx < range; idx++) {
            const field = {
                q: coords.q + (idx + 1) * sideFactor[side],
                r: coords.r,
            };
            if (
                !boardPieces.some(
                    ({ coords }) =>
                        coords.q === field.q && coords.r === field.r,
                )
            )
                legalFields[idx] = field;
            else break;
        }
        const takableFields = pawnDiagonals.flatMap(({ q, r }) =>
            boardPieces.map(
                ({ coords: otherPieceCoords, side: otherPieceSide }) => {
                    const targetCoords = {
                        q: coords.q + q * sideFactor[side],
                        r: coords.r + r * sideFactor[side],
                    };
                    return otherPieceSide !== side &&
                        otherPieceCoords.q === targetCoords.q &&
                        otherPieceCoords.r === targetCoords.r
                        ? targetCoords
                        : undefined;
                },
            ),
        );
        return legalFields.concat(takableFields).filter(Boolean);
    },
};

export const isInCheck = (side: BoardSide, boardPieces: BoardPiece[]) =>
    boardPieces
        .filter((piece) => piece.side === oppositeSide[side])
        .flatMap((piece) =>
            getAllMoves(piece.piece, piece.side, piece.coords, boardPieces),
        )
        .some(
            (move) =>
                boardPieces.find(
                    (piece) =>
                        piece.coords.q === move.q && piece.coords.r === move.r,
                )?.piece === "king",
        );

export const getAllMoves = (
    piece: Piece,
    side: BoardSide,
    coordinates: BoardCoordinates,
    boardPieces: BoardPiece[],
) => legalMoves[piece](coordinates, side, boardPieces);

export const getLegalMoves = (
    piece: Piece,
    side: BoardSide,
    coordinates: BoardCoordinates,
    boardPieces: BoardPiece[],
    boardSize: BoardCoordinates,
) =>
    getAllMoves(piece, side, coordinates, boardPieces).filter(
        (move) =>
            isOnBoard(move, boardSize) &&
            !isInCheck(
                side,
                movePiece({ from: coordinates, to: move }, boardPieces),
            ),
    );
