import { signal } from "@preact/signals";
import { ClientSocket } from "socketIO/socket";

export const socket = signal<ClientSocket | undefined>(undefined);
