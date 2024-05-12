# 0xChess

chess on a hexagonal board that is not patented

## how can I get up and running locally?

```
bun i && bun start
```

note however, that you need to host the frontend if you want to play in your local network
(e.g. by adding `server: { host: true },` to the `vite.config.ts`)

## what's next for this project?

-   [ ] add tutorial / move info
-   [ ] enable mirrored starting positions
-   [ ] enable randomised starting positions
-   [ ] enable WeGo mechanic
-   [ ] enable clock games
-   [ ] enable more boards
-   [ ] enable concurrent games (maybe even accounts)
-   [ ] make socket protocol more robust

## technical remarks

if the technical side of this project tickles your fancy, here are some things I should have done differently:

-   use zustand instead of shoving preacts signals around
    -   the subscriptions would have probably played nicer with phaser
    -   would have lead to less duplications of state in phaser vs preact
-   having "type safe" sockets might not be worth having an unholy wrapper for client and server sockets
-   phasers (stateful) object based approach to rendering is not my cup of tea
    -   turns out, I prefer libraries like raylib, LÖVE 2D, libGDX or MonoGame (maybe even in that order)
