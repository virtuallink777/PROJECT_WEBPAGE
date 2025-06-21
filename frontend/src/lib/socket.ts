import { io, Socket } from "socket.io-client";

const URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export const socket: Socket = io(URL, {
  autoConnect: false, // Evita conexión automática
  reconnection: true, // Permite reconexiones automáticas
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});
