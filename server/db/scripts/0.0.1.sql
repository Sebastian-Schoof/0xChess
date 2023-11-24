create table
    tableVersions (name text not null, version text not null);

create table
    games (
        id text primary key,
        boardState blob not null,
        toMove integer not null
    );

insert into
    tableVersions (name, version)
values
    ('games', '0.0.1');

create table
    gameUsers (
        gameId text not null,
        userId text not null,
        side integer not null,
        primary key (gameId, userId, side),
        foreign key (gameId) references games (id)
    );

insert into
    tableVersions (name, version)
values
    ('gameUsers', '0.0.1');