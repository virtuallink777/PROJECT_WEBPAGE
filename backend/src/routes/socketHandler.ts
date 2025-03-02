import { Server, Socket } from "socket.io";
import { clearPendingValidations, pendingValidations } from "./validatesAdmin";

interface CustomSocket extends Socket {
  userId?: string;
  email?: string;
}

export const connectedAdmin: Record<string, string> = {};
export const connectedUsers: Record<string, string> = {};
export let adminSocketId: string | null = null; // Guarda el socket del único admin
export let userSocketId: string | null = null; // Guarda el socket del único usuario

// Email del administrador autorizado
const ADMIN_EMAIL = "luiscantorhitchclief@gmail.com";

export const configureSockets = (io: Server) => {
  io.on("connection", async (socket: CustomSocket) => {
    console.log("🔗 se ha encendido el socket del BACKEND");

    // 🔹 Identificar al admin cuando se conecta

    socket.on("identificar-admin", (data) => {
      console.log("📩 Evento recibido con data:", data);
      const { adminId, email } = data || {}; // Desestructurar con seguridad
      console.log(
        `📩 Recibido 'identificar-admin' con ID: ${adminId} y Email: ${email}`
      );

      if (email !== ADMIN_EMAIL) {
        console.log(
          "🚫 Acceso denegado: el usuario no es un administrador autorizado."
        );
        return;
      }

      // Verificar si ya hay un admin registrado con este socket
      if (adminSocketId === socket.id) {
        console.log(`⚠️ Admin ya identificado en este socket. Ignorando...`);
        return; // Evitar identificarlo de nuevo
      }

      // Guardar el socket del admin
      adminSocketId = socket.id;
      connectedAdmin[adminId] = socket.id;

      console.log(
        `👤 Admin identificado: ${adminId} (Socket ID: ${socket.id})`
      );

      // Enviar validaciones pendientes solo una vez
      if (pendingValidations.length > 0) {
        console.log(
          `📤 Enviando ${pendingValidations.length} validaciones pendientes al admin...`
        );

        pendingValidations.forEach((validation) => {
          io.to(socket.id).emit(
            "validate-publication",
            validation.body,
            validation.fileUrls
          );
        });

        clearPendingValidations(); // Limpiar las validaciones pendientes
      }
    });

    // 🔹 Identificar al usuario
    socket.on("identificar-usuario", async (userId: string) => {
      socket.userId = userId;
      connectedUsers[userId] = socket.id;
      userSocketId = socket.id;
      console.log(`👤 Usuario identificado: ${userId}`);
    });

    // 🟢 Escuchar cuando el admin aprueba/rechaza la publicación
    socket.on("actualizar-publicacion", ({ id, userId, estado, razon }) => {
      console.log(
        `📩 Evento recibido: actualizar-publicacion para usuario ${userId}`
      );

      const userSocket = connectedUsers[userId];
      if (userSocket) {
        io.to(userSocket).emit("actualizar-publicacion", {
          id,
          estado,
          razon,
        });
        console.log(`📤 Notificación enviada al usuario ${userId}`);
      } else {
        console.log(`🚫 Usuario ${userId} no conectado, no se pudo enviar`);
      }
    });

    // 🛑 Manejar desconexión del admin

    socket.on("admin-logout", (data) => {
      console.log("🛑 Evento 'admin-logout' detectado en el backend", data);
      const { adminId, email } = data;
      console.log(
        `📩 Evento 'admin-logout' recibido con ID: ${adminId} y Email: ${email}`
      );

      // Verificar si el socket a desconectar es el del admin
      if (connectedAdmin[adminId] === socket.id) {
        console.log(
          `❌ Eliminando admin: ${adminId} (Socket ID: ${socket.id})`
        );
        delete connectedAdmin[adminId]; // Eliminar admin del registro
      }

      if (adminSocketId === socket.id) {
        adminSocketId = null;
        console.log("🛑 Admin desconectado manualmente.");
      }

      socket.disconnect(true); // 🔥 Forzar desconexión del socket
    });

    socket.on("disconnect", () => {
      console.log(`🔴 Socket desconectado: ${socket.id}`);

      // Buscar si este socket estaba asignado a un admin
      const adminToRemove = Object.keys(connectedAdmin).find(
        (key) => connectedAdmin[key] === socket.id
      );

      if (adminToRemove) {
        console.log(
          `❌ Eliminando admin: ${adminToRemove} (Socket ID: ${socket.id})`
        );
        delete connectedAdmin[adminToRemove]; // Eliminar admin del registro
      }

      if (adminSocketId === socket.id) {
        adminSocketId = null;
        console.log("🛑 Admin desconectado. Ya no hay admin activo.");
      }
    });
  });
};

// 📌 Función para obtener el socket del admin
export const getAdminSocket = () => {
  return Object.values(connectedAdmin)[0] || null; // Tomar el primer socket registrado
};
export const getUserSocket = (userId: string) => connectedUsers[userId];
