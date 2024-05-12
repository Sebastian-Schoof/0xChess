type Theme = {
    board: [number, number, number];
    stroke: number;
    highlights: { possibleMoves: number; moveTarget: number; check: number };
};

export const themes = {
    default: {
        board: [0xf5cca3, 0xeeaa66, 0xe78829],
        stroke: 0xffffff,
        highlights: {
            possibleMoves: 0x66eeaa,
            moveTarget: 0x66ee66,
            check: 0xaa66ee,
        },
    } as Theme,
} as const;
