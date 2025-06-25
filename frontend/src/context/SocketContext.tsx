// src/context/SocketContext.tsx
"use client";

import React, { createContext, useContext, useEffect, useMemo } from "react";
import { io, Socket } from "socket.io-client";

interface ISocketContext {
  socket: Socket | null;
}

const SocketContext = createContext<ISocketContext>({
  socket: null,
});

export const useSocketContext = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const socket = useMemo(() => {
    const socketURL = process.env.NEXT_PUBLIC_SOCKET_URL;
    if (!socketURL) {
      console.error("SocketContext: NEXT_PUBLIC_SOCKET_URL no está definida.");
      // Devolver null o manejar el error como prefieras
      return null;
    }
    return io(socketURL, {
      // Opciones adicionales si las necesitas, por ejemplo:
      // autoConnect: false,
      // transports: ['websocket']
    });
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleConnect = () => console.log("Socket conectado:", socket.id);
    const handleDisconnect = () => console.log("Socket desconectado");

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    // Conectar si no se conecta automáticamente
    if (!socket.connected) {
      socket.connect();
    }

    // Limpieza al desmontar el Provider (cuando la app se cierra)
    return () => {
      console.log("Desconectando socket...");
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.disconnect();
    };
  }, [socket]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};
