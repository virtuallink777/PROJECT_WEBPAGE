import { Server as SocketIOServer } from "socket.io";

// --- AÑADIDO 1: Mueve el mapa fuera de la función para poder exportarlo ---
const connectedUsersChat = new Map<string, string>();

// --- AÑADIDO 2: Crea y exporta una función para consultar este mapa ---
export function isUserOnlineForChat(userId: string): boolean {
  return connectedUsersChat.has(userId);
}

const configureSocketChat = (io: SocketIOServer) => {
  // Almacén para rastrear usuarios conectados (userId -> socketId)
  //const connectedUsers = new Map<string, string>();

  io.on("connection", (socket) => {
    console.log("Usuario conectado:", socket.id);

    // --- AÑADIDO: Nuevo listener para chequear el estado de un usuario ---
    socket.on("check_user_status", (userId, callback) => {
      // Usamos la función que ya creamos para consultar el mapa
      const isOnline = isUserOnlineForChat(userId);

      // El 'callback' es una función que el frontend nos pasa para recibir la respuesta.
      // Es una forma muy eficiente de responder a una petición específica.
      if (typeof callback === "function") {
        callback({ online: isOnline });
      }
    });

    // Unir al usuario a su room basado en su userId
    socket.on("joinRoom", (userId: string) => {
      socket.join(userId);
      connectedUsersChat.set(userId, socket.id);
      console.log(`Usuario ${userId} unido a su sala privada`);
    });

    // Escuchar cuando un usuario envía un mensaje
    socket.on("sendMessage", (message) => {
      console.log("Mensaje recibido en el backend:", message);

      // Verificar si el usuario receptor está conectado
      if (connectedUsersChat.has(message.receiverId)) {
        // Si está conectado, enviar mensaje normalmente
        io.to(message.receiverId).emit("newMessage", message);
        console.log("📌 Reenviando a receiverId:", message.receiverId);
      } else {
        // Si no está conectado, se envía un mensaje especial al cliente
        socket.emit("userOffline", {
          receiverId: message.receiverId,
          conversationId: message.conversationId,
          message: "El usuario no está conectado actualmente",
        });
      }
    });

    // Manejar desconexión de usuarios
    socket.on("disconnect", () => {
      // Buscar el userId asociado a este socket
      for (const [userId, socketId] of connectedUsersChat.entries()) {
        if (socketId === socket.id) {
          connectedUsersChat.delete(userId);
          console.log(`Usuario ${userId} desconectado`);
          break;
        }
      }
    });
  });

  return io;
};

export default configureSocketChat;
