import { defaultPort } from "socketIO/const";
import { run } from "socketIO/socket";

const port = +process.env.PORT! || defaultPort;

run(port);

console.log("server running on port", port);
