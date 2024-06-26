import { BoardPiece, BoardSide } from "common/game/types";
import db from "db/database";

const createGameQueryStatements = [
    "insert into games values ($id, $boardState, $toMove);",
    "insert into gameUsers values ($id, $white, 0);",
    "insert into gameUsers values ($id, $black, 1);",
].map((statement) => db.prepare(statement));
type CreateGameQueryParams = {
    $id: string;
    $boardState: Buffer;
    $toMove: number;
    $white: string;
    $black: string;
};
const createGameQueryTransaction = db.transaction(
    (gameDetails: CreateGameQueryParams) => {
        createGameQueryStatements[0].run({
            $id: gameDetails.$id,
            $boardState: gameDetails.$boardState,
            $toMove: gameDetails.$boardState,
        });
        createGameQueryStatements[1].run({
            $id: gameDetails.$id,
            $white: gameDetails.$white,
        });
        createGameQueryStatements[2].run({
            $id: gameDetails.$id,
            $black: gameDetails.$black,
        });
    },
);

const getGameByUserIdQuery = db.prepare(`
    select * from (
        select
            g.id gameId, g.boardState, g.toMove, null userId, null side
        from
            games g
            inner join gameUsers gU on gU.gameId = g.id 
        where gU.userId = $userId
    union all
        select
            null gameId, null boardState, null toMove, userId, side
        from gameUsers
        where gameId = (
            select gameId
            from gameUsers
            where userId = $userId
        )
    );
`);
type GetGameByUserIdQueryParams = { $userId: string };
type GetGameByUserIdQueryReturnGameColumn = {
    gameId: string;
    boardState: Uint8Array;
    toMove: number;
    userId: null;
    side: null;
};
type GetGameByUserIdQueryReturnUserColumn = {
    gameId: null;
    boardState: null;
    toMove: number;
    userId: string;
    side: number;
};
type GetGameByUserIdQueryReturn = [
    GetGameByUserIdQueryReturnGameColumn,
    GetGameByUserIdQueryReturnUserColumn,
    GetGameByUserIdQueryReturnUserColumn,
];

const updateGameQuery = db.prepare(`
    update games
    set
        boardState = $boardState,
        toMove = (toMove | 1) - (toMove & 1)
    where
        id = $gameId;
`);
type UpdateGameQueryParams = { $gameId: string; $boardState: Uint8Array };

const endGameQueryStatements = [
    "delete from gameUsers where gameId = $gameId;",
    "delete from games where id = $gameId;",
].map((statement) => db.prepare(statement));
type EndGameQueryParams = { $gameId: string };
const endGameQueryTransaction = db.transaction(
    (gameDetails: EndGameQueryParams) =>
        endGameQueryStatements.forEach((statement) =>
            statement.run(gameDetails),
        ),
);

const blobEncoder = new TextEncoder();
const blobDecoder = new TextDecoder();

export function createGame(
    id: string,
    game: {
        connections: {
            [side in BoardSide]: { userId: string };
        };
        state: { pieces: BoardPiece[]; toMove: BoardSide };
    },
) {
    createGameQueryTransaction({
        $id: id,
        $boardState: Buffer.from(JSON.stringify(game.state.pieces)),
        $toMove: game.state.toMove === "white" ? 0 : 1,
        $white: game.connections.white.userId,
        $black: game.connections.black.userId,
    });
}

export function getGameByUserId(userId: string) {
    const params: GetGameByUserIdQueryParams = { $userId: userId };
    const dbValues = getGameByUserIdQuery.all(
        params,
    ) as GetGameByUserIdQueryReturn;
    return dbValues.length
        ? {
              gameId: dbValues[0].gameId,
              game: {
                  connections: Object.fromEntries(
                      [dbValues[1], dbValues[2]].map(({ userId, side }) => [
                          side === 0 ? "white" : "black",
                          { userId },
                      ]),
                  ) as {
                      [key in BoardSide]: { userId: string };
                  },
                  state: {
                      pieces: JSON.parse(
                          blobDecoder.decode(dbValues[0].boardState),
                      ),
                      toMove: (dbValues[0].toMove === 0
                          ? "white"
                          : "black") as BoardSide,
                  },
              },
          }
        : null;
}

export function updateGame(gameId: string, boardState: BoardPiece[]) {
    const params: UpdateGameQueryParams = {
        $gameId: gameId,
        $boardState: blobEncoder.encode(JSON.stringify(boardState)),
    };
    updateGameQuery.run(params);
}

export function endGame(gameId: string) {
    endGameQueryTransaction({ $gameId: gameId });
}
