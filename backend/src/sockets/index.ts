import { Server as SocketIOServer } from "socket.io";

const configureSocketChat = (io: SocketIOServer) => {
  io.on("connection", (socket) => {
    console.log("Usuario conectado:", socket.id);

    // Unir al usuario a su room basado en su userId
    socket.on("joinRoom", (userId) => {
      socket.join(userId);
      console.log(`Usuario ${userId} unido a su sala privada`);
    });

    // Escuchar cuando un usuario envía un mensaje
    socket.on("sendMessage", (message) => {
      console.log("Mensaje recibido en el backend:", message);
      console.log("📌 Reenviando a receiverId:", message.receiverId);

      // Reenviar solo al receptor del mensaje
      io.to(message.receiverId).emit("newMessage", message);
    });

    socket.on("disconnect", () => {
      console.log("Usuario desconectado:", socket.id);
    });
  });

  return io;
};

export default configureSocketChat;
