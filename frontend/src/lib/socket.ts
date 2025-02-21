import { io, Socket } from "socket.io-client";

const URL = "http://localhost:4004";

export const socket: Socket = io(URL, {
  autoConnect: false, // Evita conexión automática
  reconnection: true, // Permite reconexiones automáticas
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});
