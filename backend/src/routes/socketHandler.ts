import { Server, Socket } from "socket.io";
import {
  clearPendingValidations,
  pendingValidations,
  PendingValidation,
  PendingIdentityValidation,
  // PendingPublicationValidation, // Opcional si no la usas directamente para casteo aquí
} from "./validatesAdmin"; // Asegúrate que la ruta './validatesAdmin' es correcta

// Interfaz para añadir propiedades personalizadas a los sockets
interface CustomSocket extends Socket {
  userId?: string; // Para identificar usuarios normales
  isAdmin?: boolean; // Para marcar un socket como de administrador
  adminAppId?: string; // Para guardar el adminId que el cliente envía
}

// Interfaz para el payload que el admin envía al identificarse
interface AdminIdentificationData {
  adminId: string;
  email: string;
}

// Interfaz para el payload de validación de identidad que se emite al admin
interface IdentityValidationPayload {
  userId: string;
  publicationId: string;
  body: any;
  fileUrls: {
    documentFront: string;
    documentBack: string;
  };
}

// Almacenamiento del estado de conexión
export const connectedAdmin: Record<string, string> = {}; // adminId -> socket.id
export const connectedUsers: Record<string, string> = {}; // userId -> socket.id
export let adminSocketId: string | null = null; // El socket.id del admin actualmente activo

const ADMIN_EMAIL = "luiscantorhitchclief@gmail.com"; // Email del administrador autorizado

export const configureSockets = (io: Server) => {
  io.on("connection", (socket: CustomSocket) => {
    // Usar CustomSocket
    console.log(`[Socket ${socket.id}] 🔗 Conexión establecida.`);

    socket.on("identificar-admin", (data: AdminIdentificationData) => {
      console.log(
        `[Socket ${socket.id}] 📩 Evento 'identificar-admin' recibido:`,
        data
      );
      const { adminId, email } = data || {};

      if (email !== ADMIN_EMAIL) {
        console.log(
          `[Socket ${socket.id}] 🚫 Acceso denegado para 'identificar-admin': email no autorizado (${email}).`
        );
        return;
      }

      // Si ya hay un admin conectado con un socket DIFERENTE, podrías manejarlo (ej: desconectar el anterior)
      // Por ahora, este nuevo socket se convierte en el admin principal.
      const previousAdminSocketId = adminSocketId;
      adminSocketId = socket.id;
      socket.isAdmin = true; // Marcar este socket como admin
      if (adminId) {
        socket.adminAppId = adminId; // Guardar el adminId en el socket
        connectedAdmin[adminId] = socket.id; // Actualizar el mapa
        console.log(
          `[Socket ${socket.id}] 👤 Admin ${adminId} identificado. Socket ID: ${
            socket.id
          }. Socket anterior del admin: ${previousAdminSocketId || "Ninguno"}.`
        );
      } else {
        console.warn(
          `[Socket ${
            socket.id
          }] 👤 Admin identificado (sin adminId proporcionado en data). Socket ID: ${
            socket.id
          }. Socket anterior del admin: ${previousAdminSocketId || "Ninguno"}.`
        );
      }

      if (pendingValidations.length > 0) {
        console.log(
          `[Socket ${socket.id}] 📤 Enviando ${pendingValidations.length} validaciones pendientes al admin...`
        );
        pendingValidations.forEach((validation: PendingValidation) => {
          console.log(
            `[Socket ${socket.id}]   -> Procesando validación pendiente: tipo ${validation.type}`
          );
          // 👇 Añade estos logs de verificación
          console.log("=== INICIO DE VALIDACIÓN PENDIENTE ===");
          console.log("Tipo de validación:", validation.type);
          console.log(
            "Contenido completo de la validación:",
            JSON.stringify(validation, null, 2)
          );
          if (validation.type === "identity") {
            const identityValidation = validation as PendingIdentityValidation;
            const payloadForIdentity: IdentityValidationPayload = {
              userId: identityValidation.userId,
              publicationId: identityValidation.publicationId,
              body: identityValidation.originalBody,
              fileUrls: {
                documentFront: identityValidation.fileUrls.documentFront!,
                documentBack: identityValidation.fileUrls.documentBack!,
              },
            };
            console.log(
              `[Socket ${socket.id}]     Emitiendo 'validate-identity-document' para publicationId: ${payloadForIdentity.publicationId}`
            );
            socket.emit("validate-identity-document", payloadForIdentity);
          } else if (validation.type === "publication") {
            console.log("📢 Emitiendo validate-publication");
            console.log("Contenido de fileUrls:", validation.fileUrls);
            console.log("Tipo de fileUrls:", typeof validation.fileUrls);

            console.log(
              `[Socket ${socket.id}]     Emitiendo 'validate-publication'`
            );
            socket.emit(
              "validate-publication",
              validation.originalBody,
              validation.fileUrls
            );
          }
        });
        clearPendingValidations();
        console.log(
          `[Socket ${socket.id}] ✅ Validaciones pendientes enviadas y limpiadas.`
        );
      } else {
        console.log(
          `[Socket ${socket.id}] 👍 No hay validaciones pendientes para enviar al admin.`
        );
      }
    });

    socket.on("identificar-usuario", (userId: string) => {
      console.log(
        `[Socket ${socket.id}] 📩 Evento 'identificar-usuario' recibido para userId: ${userId}`
      );
      socket.userId = userId; // Guardar userId en el objeto socket
      connectedUsers[userId] = socket.id;
      // userSocketId = socket.id; // Esta variable global para un solo userSocketId es propensa a errores si tienes múltiples usuarios.
      // Es mejor confiar en el mapa 'connectedUsers'.
      console.log(
        `[Socket ${socket.id}] 👤 Usuario ${userId} identificado y mapeado.`
      );
    });

    socket.on("actualizar-publicacion", ({ id, userId, estado, razon }) => {
      console.log(
        `[Socket ${socket.id}] 📩 Evento 'actualizar-publicacion' recibido para usuario ${userId}, estado ${estado}`
      );
      const targetUserSocketId = connectedUsers[userId];
      if (targetUserSocketId) {
        io.to(targetUserSocketId).emit("actualizar-publicacion", {
          id,
          estado,
          razon,
        });
        console.log(
          `[Socket ${socket.id}] 📤 Notificación 'actualizar-publicacion' enviada al usuario ${userId} (Socket: ${targetUserSocketId}).`
        );
      } else {
        console.log(
          `[Socket ${socket.id}] 🚫 Usuario ${userId} no encontrado en connectedUsers para 'actualizar-publicacion'.`
        );
      }
    });

    socket.on("admin-logout", (data: AdminIdentificationData) => {
      console.log(
        `[Socket ${socket.id}] 🛑 Evento 'admin-logout' recibido:`,
        data
      );
      const { adminId } = data || {};

      if (socket.isAdmin) {
        // Solo actuar si el socket que emite es realmente un admin
        if (adminId && connectedAdmin[adminId] === socket.id) {
          console.log(
            `[Socket ${socket.id}]   🧹 Limpiando admin ${adminId} de connectedAdmin (logout).`
          );
          delete connectedAdmin[adminId];
        }
        if (adminSocketId === socket.id) {
          console.log(
            `[Socket ${socket.id}]   🧹 Limpiando adminSocketId (logout).`
          );
          adminSocketId = null;
        }
        socket.isAdmin = false; // Desmarcar el socket como admin
        socket.adminAppId = undefined;
        console.log(
          `[Socket ${socket.id}]   📤 Admin ${
            adminId || "N/A"
          } deslogueado (manualmente).`
        );
        // No es necesario llamar a socket.disconnect(true) aquí, el cliente maneja su desconexión.
      } else {
        console.warn(
          `[Socket ${socket.id}]   ⚠️ Evento 'admin-logout' recibido de un socket no admin.`
        );
      }
    });

    socket.on("disconnect", (reason: string) => {
      console.log(`[Socket ${socket.id}] 🔴 Desconexión. Razón: ${reason}`);

      // Limpiar si este socket era de un admin
      if (socket.isAdmin) {
        // Verificar la propiedad del socket
        if (
          socket.adminAppId &&
          connectedAdmin[socket.adminAppId] === socket.id
        ) {
          console.log(
            `[Socket ${socket.id}]   🧹 Limpiando admin ${socket.adminAppId} de connectedAdmin (disconnect).`
          );
          delete connectedAdmin[socket.adminAppId];
        }
        if (adminSocketId === socket.id) {
          console.log(
            `[Socket ${socket.id}]   🧹 Limpiando adminSocketId global (disconnect).`
          );
          adminSocketId = null;
        }
        console.log(`[Socket ${socket.id}]   🛡️ Admin desconectado.`);
      }

      // Limpiar si este socket era de un usuario normal
      if (socket.userId && connectedUsers[socket.userId] === socket.id) {
        console.log(
          `[Socket ${socket.id}]   🧹 Limpiando usuario ${socket.userId} de connectedUsers (disconnect).`
        );
        delete connectedUsers[socket.userId];
        console.log(
          `[Socket ${socket.id}]   👤 Usuario ${socket.userId} desconectado.`
        );
      }
      // La variable global userSocketId la he quitado de la limpieza aquí porque su uso es problemático
      // si tienes más de un usuario. Confía en `connectedUsers`.
    });
  });
};

// ESTA FUNCIÓN SOLO DEVUELVE EL ID ALMACENADO
export const getAdminSocket = (): string | null => {
  return adminSocketId;
};

export const getUserSocket = (userId: string): string | undefined => {
  return connectedUsers[userId];
};

// 'io' necesita ser accesible para getAdminSocket si quieres hacer la verificación io.sockets.sockets.get()
// Esto implica que 'io' debe ser exportada desde tu archivo principal y luego importada aquí,
// o pasada a getAdminSocket, lo cual es más complicado.
// Por ahora, getAdminSocket solo devuelve el ID. La verificación de actividad se hace en validatesAdmin.ts.
// Si quieres la verificación aquí, necesitarías acceso a la instancia 'io'.
// Una forma es guardar la instancia 'io' en una variable global en este módulo:

let SIO_INSTANCE: Server | null = null;
export const configureSocketsAndGetInstance = (io: Server) => {
  SIO_INSTANCE = io;
  // Llama a tu configureSockets original
  configureSockets(io); // Ahora configureSockets puede usar SIO_INSTANCE si es necesario
  // o simplemente seguimos pasando 'io' como argumento.
};

// Modificamos getAdminSocket para usar SIO_INSTANCE
export const getActiveAdminSocket = (): string | null => {
  if (
    adminSocketId &&
    SIO_INSTANCE &&
    SIO_INSTANCE.sockets.sockets.get(adminSocketId)
  ) {
    return adminSocketId;
  }
  if (adminSocketId) {
    // Si existía pero ya no está activo
    console.warn(
      `[getActiveAdminSocket] adminSocketId (${adminSocketId}) encontrado pero el socket ya no existe en SIO_INSTANCE. Limpiando.`
    );
    const adminIdToRemove = Object.keys(connectedAdmin).find(
      (key) => connectedAdmin[key] === adminSocketId
    );
    if (adminIdToRemove) delete connectedAdmin[adminIdToRemove];
    adminSocketId = null;
  }
  return null;
};

// DEBES CAMBIAR en validatesAdmin.ts para usar getActiveAdminSocket()
// y pasarle la instancia 'io' a este módulo o usar la variable SIO_INSTANCE.
// La forma más simple es que validatesAdmin.ts siga haciendo:
// const adminSocketId = getAdminSocket(); // Obtiene el ID
// const isAdminConnectedAndActive = adminSocketId && io.sockets.sockets.get(adminSocketId); // Verifica actividad usando la 'io' que tiene
