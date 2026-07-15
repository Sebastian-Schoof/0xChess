# 0xChess

chess on a hexagonal board that is not patented

## how can I get up and running locally?

```
npm install && npm start
```

## what's next for this project?

- [ ] ??? (depends on feedback)

## technical remarks

if the technical side of this project tickles your fancy, here are some things I should have done differently:

- don't have a single package.json for frontend and backend
- use zustand instead of shoving preacts signals around
    - the subscriptions would have probably played nicer with phaser
    - would have lead to less duplications of state in phaser vs preact
- having "type safe" sockets might not be worth having an unholy wrapper for client and server sockets
- phasers (stateful) object based approach to rendering is not my cup of tea
    - turns out, I prefer libraries like raylib, LÖVE 2D, libGDX or MonoGame (maybe even in that order)
