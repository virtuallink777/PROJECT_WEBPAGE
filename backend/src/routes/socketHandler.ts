// =======================================================================================
// ARCHIVO ÚNICO DE CONFIGURACIÓN DE SOCKETS
//
// =======================================================================================

import { Server, Socket } from "socket.io";
import {
  clearPendingValidations,
  pendingValidations,
  PendingValidation,
  PendingIdentityValidation,
} from "./validatesAdmin"; // Asegúrate que la ruta sea correcta

// --- INTERFACES (Se mantienen igual) ---
interface CustomSocket extends Socket {
  userId?: string;
  isAdmin?: boolean;
  adminAppId?: string;
}
interface AdminIdentificationData {
  adminId: string;
  email: string;
}
interface IdentityValidationPayload {
  userId: string;
  publicationId: string;
  body: any;
  fileUrls: {
    documentFront: string;
    documentBack: string;
  };
}

// --- ALMACENAMIENTO CENTRALIZADO (Las únicas listas que usaremos) ---
export const connectedAdmin: Record<string, string> = {};
export const connectedUsersChat = new Map<string, string>(); // Mapa para: userId -> socket.id
export let adminSocketId: string | null = null;
const ADMIN_EMAIL = "luiscantorhitchclief@gmail.com";

// --- FUNCIÓN DE AYUDA (Para consultar estado desde fuera si lo necesitas) ---
export function isUserOnlineForChat(userId: string): boolean {
  return connectedUsersChat.has(userId);
}

// --- ¡LA ÚNICA FUNCIÓN DE CONFIGURACIÓN QUE NECESITAS! ---
export const configureSockets = (io: Server) => {
  io.on("connection", (socket: CustomSocket) => {
    console.log(`[Socket ${socket.id}] 🔗 Conexión establecida.`);

    // =======================================================
    // == LÓGICA DE IDENTIFICACIÓN (ADMIN) ==
    // =======================================================
    socket.on("identificar-admin", (data: AdminIdentificationData) => {
      console.log(
        `[Socket ${socket.id}] 📩 Evento 'identificar-admin' recibido:`,
        data
      );
      const { adminId, email } = data || {};

      if (email !== ADMIN_EMAIL) {
        console.log(
          `[Socket ${socket.id}] 🚫 Acceso denegado: email no autorizado.`
        );
        return;
      }

      adminSocketId = socket.id;
      socket.isAdmin = true;
      if (adminId) {
        socket.adminAppId = adminId;
        connectedAdmin[adminId] = socket.id;
        console.log(`[Socket ${socket.id}] 👤 Admin ${adminId} identificado.`);
      }

      if (pendingValidations.length > 0) {
        console.log(
          `[Socket ${socket.id}] 📤 Enviando ${pendingValidations.length} validaciones pendientes...`
        );

        pendingValidations.forEach((validation: PendingValidation) => {
          // Verificamos el tipo de validación
          if (validation.type === "identity") {
            // La lógica para 'identity' parece ser diferente y podría ya estar bien,
            // la mantenemos por si acaso, pero aseguramos que el payload sea correcto.
            const identityValidation = validation as PendingIdentityValidation;
            console.log(
              "Enviando validación de IDENTIDAD pendiente:",
              identityValidation
            );
            socket.emit(
              "validate-identity-document",
              identityValidation.originalBody
            );
          } else if (validation.type === "publication") {
            // --- ESTA ES LA PARTE CORREGIDA ---
            // El objeto 'validation.originalBody' ya es el 'payloadCompleto'
            // que guardamos en el JSON, con la estructura correcta.
            // Lo emitimos como UN SOLO argumento.
            console.log(
              "Enviando validación de PUBLICACIÓN pendiente:",
              validation.originalBody
            );
            socket.emit("validate-publication", validation.originalBody);
          }
        });

        // Limpiamos las validaciones DESPUÉS de haberlas enviado todas.
        clearPendingValidations();
        console.log(
          `[Socket ${socket.id}] ✅ Validaciones pendientes enviadas y limpiadas.`
        );
      }
    });

    // =======================================================
    // == LÓGICA DE IDENTIFICACIÓN Y SALAS (USUARIOS Y CLIENTES) ==
    // =======================================================

    // Este evento es para cuando un DUEÑO se loguea.
    socket.on("identificar-usuario", (userId: string) => {
      console.log(
        `[Socket ${socket.id}] 📩 Evento 'identificar-usuario' para userId: ${userId}`
      );
      socket.userId = userId;
      connectedUsersChat.set(userId, socket.id);
      socket.join(userId); // Unimos al dueño a su sala personal
      console.log(
        `[Socket ${socket.id}] 👤 Dueño ${userId} identificado, mapeado y unido a su sala.`
      );
    });

    // Este evento es para cuando un CLIENTE abre el chat.
    socket.on("joinRoom", (userId: string) => {
      socket.userId = userId; // También guardamos el ID para clientes
      connectedUsersChat.set(userId, socket.id);
      socket.join(userId);
      console.log(`[Chat] Cliente ${userId} unido a su sala.`);
    });

    // =======================================================
    // == LÓGICA DE CHAT ==
    // =======================================================

    socket.on("sendMessage", (message) => {
      console.log("[Chat] Mensaje recibido:", message);
      const receiverId = message.receiverId;

      if (connectedUsersChat.has(receiverId)) {
        io.to(receiverId).emit("newMessage", message);
        console.log(
          `[Chat] 📌 Mensaje reenviado a la sala del receiverId: ${receiverId}`
        );
      } else {
        console.log(
          `[Chat] 🚫 Receptor ${receiverId} no está conectado. Notificando al emisor.`
        );
        socket.emit("userOffline", {
          receiverId: receiverId,
          message: "El usuario no está conectado actualmente",
        });
      }
    });

    // =======================================================
    // == OTRA LÓGICA DE EVENTOS (Se mantiene igual) ==
    // =======================================================

    // POR ESTE NUEVO BLOQUE:
    socket.on("admin_tomo_decision", ({ id, userId, estado, razon }) => {
      console.log(
        `[Backend] 📩 Decisión del admin recibida para PubID ${id}. Usuario a notificar: ${userId}`
      );

      // 1. Buscamos al usuario en nuestra lista de conectados.
      const targetSocketId = connectedUsersChat.get(userId);

      // 2. Si el usuario está conectado, le enviamos la notificación en tiempo real.
      if (targetSocketId) {
        // Usamos el evento 'actualizar-publicacion' que el frontend del usuario ya está escuchando.
        io.to(userId).emit("actualizar-publicacion", {
          id,
          estado,
          razon,
        });
        console.log(
          `[Backend] 📤 Notificación 'actualizar-publicacion' ENVIADA al usuario ${userId}`
        );

        // --- MICRÓFONO DEL BACKEND ---
        console.log(
          `VERIFICACIÓN BACKEND: Se acaba de emitir 'actualizar-publicacion' a la sala/socket: ${targetSocketId}`
        );
        // --- FIN DEL MICRÓFONO ---
      } else {
        // 3. Si no está conectado, no hacemos nada con el socket.
        // La actualización ya se guardó en la base de datos, así que la verá cuando se loguee.
        console.log(
          `[Backend] 🚫 Usuario ${userId} no está conectado. No se envía notificación en tiempo real.`
        );
      }
    });

    socket.on("check_user_status", (userId, callback) => {
      const isOnline = connectedUsersChat.has(userId);
      if (typeof callback === "function") {
        callback({ online: isOnline });
      }
    });

    // =======================================================
    // == LÓGICA DE DESCONEXIÓN (ÚNICA Y CENTRALIZADA) ==
    // =======================================================

    socket.on("disconnect", (reason: string) => {
      console.log(`[Socket ${socket.id}] 🔴 Desconexión. Razón: ${reason}`);

      // Limpiar si era admin
      if (socket.isAdmin) {
        if (
          socket.adminAppId &&
          connectedAdmin[socket.adminAppId] === socket.id
        ) {
          delete connectedAdmin[socket.adminAppId];
        }
        if (adminSocketId === socket.id) {
          adminSocketId = null;
        }
        console.log(`[Socket ${socket.id}]   🛡️ Admin desconectado.`);
      }

      // Limpiar si era un usuario/cliente
      // La propiedad 'socket.userId' se guarda tanto en 'identificar-usuario' como en 'joinRoom'
      if (socket.userId) {
        // Solo borramos si el socket que se va es el que está registrado en el mapa,
        // para evitar borrar una nueva conexión del mismo usuario por error.
        if (connectedUsersChat.get(socket.userId) === socket.id) {
          connectedUsersChat.delete(socket.userId);
          console.log(
            `[Socket ${socket.id}]   🧹 Usuario ${socket.userId} eliminado del mapa de chat.`
          );
        }
      }
    });
  });
};

// =======================================================
// OTRAS FUNCIONES DE AYUDA (Se mantienen por si las usas en otra parte)
// =======================================================

export const getAdminSocket = (): string | null => {
  return adminSocketId;
};

// Esta función ahora está obsoleta, ya que no usamos el mapa 'connectedUsers'
// export const getUserSocket = (userId: string): string | undefined => {
//   return connectedUsers[userId];
// };

let SIO_INSTANCE: Server | null = null;
export const configureSocketsAndGetInstance = (io: Server) => {
  SIO_INSTANCE = io;
  configureSockets(io);
};

export const getActiveAdminSocket = (): string | null => {
  if (
    adminSocketId &&
    SIO_INSTANCE &&
    SIO_INSTANCE.sockets.sockets.get(adminSocketId)
  ) {
    return adminSocketId;
  }
  if (adminSocketId) {
    console.warn(
      `[getActiveAdminSocket] adminSocketId (${adminSocketId}) encontrado pero inactivo. Limpiando.`
    );
    const adminIdToRemove = Object.keys(connectedAdmin).find(
      (key) => connectedAdmin[key] === adminSocketId
    );
    if (adminIdToRemove) delete connectedAdmin[adminIdToRemove];
    adminSocketId = null;
  }
  return null;
};
