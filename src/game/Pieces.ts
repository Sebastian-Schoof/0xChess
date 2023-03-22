import {
    BoardCoordinates,
    BoardSide,
    Piece,
    BoardPiece,
    sideFactor,
    boardSides,
} from "./types";

const initialSetup = [
    ["king", { q: -6, r: 0 }],
    ["queen", { q: -5, r: -1 }],
    ["rook", { q: -4, r: -4 }],
    ["rook", { q: -8, r: 4 }],
    ["bishop", { q: -5, r: -2 }],
    ["bishop", { q: -5, r: 0 }],
    ["bishop", { q: -6, r: 1 }],
    ["knight", { q: -4, r: -3 }],
    ["knight", { q: -7, r: 2 }],
    ["knight", { q: -7, r: 3 }],
    ["pawn", { q: -3, r: -4 }],
    ["pawn", { q: -3, r: -3 }],
    ["pawn", { q: -4, r: -2 }],
    ["pawn", { q: -4, r: -1 }],
    ["pawn", { q: -4, r: 0 }],
    ["pawn", { q: -5, r: 1 }],
    ["pawn", { q: -6, r: 2 }],
    ["pawn", { q: -6, r: 3 }],
    ["pawn", { q: -7, r: 4 }],
] as const;

export const initialBoardSetup = Object.fromEntries(
    boardSides.map(
        (side) =>
            [
                side,
                initialSetup.map(
                    ([piece, { q, r }]) =>
                        [
                            piece,
                            {
                                q: q * sideFactor[side],
                                r: r * sideFactor[side],
                            },
                        ] as const
                ),
            ] as const
    )
) as { [side in BoardSide]: [Piece, BoardCoordinates][] };

const diagonalDirections = [
    { q: 1, r: -2 },
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
    maxDirectionScale: number
) {
    const legalFields = [] as BoardCoordinates[];
    for (const direction of [1, -1].flatMap((factor) =>
        directions.map((direction) => ({
            q: direction.q * factor,
            r: direction.r * factor,
        }))
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
                    pieceCoords.r === targetField.r
            );
            if (!pieceOnTargetField || pieceOnTargetField.side !== side)
                legalFields.push(targetField);
            if (pieceOnTargetField) break;
            directionScale++;
        }
    }
    return legalFields;
}

const legalMoves: {
    [key in Piece]: (
        coordinates: BoardCoordinates,
        side: BoardSide,
        boardPieces: BoardPiece[]
    ) => BoardCoordinates[];
} = {
    king: (coords, side, boardPieces) =>
        scaleCheck(coords, side, boardPieces, straightDirections, 1),
    queen: (coords, side, boardPieces) =>
        scaleCheck(coords, side, boardPieces, straightDirections, 12).concat(
            scaleCheck(coords, side, boardPieces, diagonalDirections, 8)
        ),
    rook: (coords, side, boardPieces) =>
        scaleCheck(coords, side, boardPieces, straightDirections, 12),
    bishop: (coords, side, boardPieces) =>
        scaleCheck(coords, side, boardPieces, diagonalDirections, 8),
    knight: (coords, side, boardPieces) => {
        const targets = [1, -1].flatMap((factor) =>
            knightDirections.map((direction) => ({
                q: coords.q + direction.q * factor,
                r: coords.r + direction.r * factor,
            }))
        );
        return targets.filter(
            (field) =>
                !boardPieces.some(
                    ({ side: pieceSide, coords }) =>
                        pieceSide === side &&
                        field.q === coords.q &&
                        field.r === coords.r
                )
        );
    },
    pawn: (coords, side, boardPieces) => {
        const legalFields = new Array(2);
        for (let idx = 0; idx < 2; idx++) {
            const field = {
                q: coords.q + (idx + 1) * sideFactor[side],
                r: coords.r,
            };
            if (
                !boardPieces.some(
                    ({ coords }) => coords.q === field.q && coords.r === field.r
                )
            )
                legalFields[idx] = field;
            else break;
        }
        return legalFields;
    },
};

export const getLegalMoves = (
    piece: Piece,
    side: BoardSide,
    coordinates: BoardCoordinates,
    boardPieces: BoardPiece[]
) => legalMoves[piece](coordinates, side, boardPieces);
