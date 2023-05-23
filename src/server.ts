import { run } from "socketIO/socket";

const port = +process.env.PORT! || 8080;

run(port);

console.log("server running on port", port);
