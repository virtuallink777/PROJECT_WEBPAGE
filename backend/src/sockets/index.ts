import { Server as SocketIOServer } from "socket.io";

const configureSocketChat = (io: SocketIOServer) => {
  // Almacén para rastrear usuarios conectados (userId -> socketId)
  const connectedUsers = new Map<string, string>();

  io.on("connection", (socket) => {
    console.log("Usuario conectado:", socket.id);

    // Unir al usuario a su room basado en su userId
    socket.on("joinRoom", (userId: string) => {
      socket.join(userId);
      connectedUsers.set(userId, socket.id);
      console.log(`Usuario ${userId} unido a su sala privada`);
    });

    // Escuchar cuando un usuario envía un mensaje
    socket.on("sendMessage", (message) => {
      console.log("Mensaje recibido en el backend:", message);

      // Verificar si el usuario receptor está conectado
      if (connectedUsers.has(message.receiverId)) {
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
      for (const [userId, socketId] of connectedUsers.entries()) {
        if (socketId === socket.id) {
          connectedUsers.delete(userId);
          console.log(`Usuario ${userId} desconectado`);
          break;
        }
      }
    });
  });

  return io;
};

export default configureSocketChat;
