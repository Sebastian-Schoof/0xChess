# 0xChess

chess on a hexagonal board that is not patented

## how can I get up and running locally?

```
npm i && npm start
```

note however, that you need to host the frontend if you want to play in your local network
(e.g. by adding `server: { host: true },` to the `vite.config.ts`)

## what's next for this project?

-   [ ] enable restraining diagonal movement
-   [ ] enable mirrored starting positions
-   [ ] enable randomised starting positions
-   [ ] enable WeGo mechanic
-   [ ] enable clock games
-   [ ] enable concurrent games (maybe even accounts)
-   [ ] make socket protocol more robust

## technical remarks

if the technical side of this project tickles your fancy, here are some things I should have done differently:

-   use zustand instead of shoving preacts signals around
    -   the subscriptions would have probably played nicer with phaser
    -   would have lead to less duplications of state in phaser vs preact
-   use deno instead of node when doing a backend
    -   especially esmodules vs ts-node was a pain to "work" with
    -   typescript is native to deno
-   having "type safe" sockets might not be worth having an unholy wrapper for client and server sockets
