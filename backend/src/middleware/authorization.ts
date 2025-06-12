// En un nuevo archivo de middlewares o en el mismo que authenticate
// (ej: src/middlewares/authorization.ts o similar)

import { RequestHandler, Request, Response, NextFunction } from "express";
import User from "../models/user.models"; // Asegúrate que la ruta sea correcta
import Publicacion from "../models/publications.models"; // Asegúrate que la ruta sea correcta
import mongoose from "mongoose";
import { UNAUTHORIZED, FORBIDDEN, NOT_FOUND } from "../constans/http"; // Asumo que tienes FORBIDDEN y NOT_FOUND

// Extender la interfaz Request para incluir las propiedades que añade 'authenticate'
interface AuthenticatedRequest extends Request {
  userId?: string;
  sessionId?: string;
  email?: string;
}

export const authorizePublicationAccess: RequestHandler = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const publicationId = req.params.id; // El ID de la publicación desde la URL
    const requestingUserId = req.userId; // El ID del usuario que hace la petición (de 'authenticate')

    if (!requestingUserId) {
      // Esto no debería ocurrir si 'authenticate' se ejecutó correctamente
      return res
        .status(UNAUTHORIZED)
        .json({ message: "User not authenticated." });
    }

    if (!mongoose.Types.ObjectId.isValid(publicationId)) {
      return res
        .status(400)
        .json({ message: "Invalid Publication ID format." });
    }

    // 1. Obtener los datos del usuario que hace la petición para verificar su rol
    const userMakingRequest = await User.findById(requestingUserId).select(
      "role"
    ); // Solo necesitamos el rol

    if (!userMakingRequest) {
      // El usuario del token ya no existe en la BD
      return res
        .status(UNAUTHORIZED)
        .json({ message: "Authenticated user not found." });
    }

    // 2. Verificar si el usuario es Administrador o Validador
    //    Asegúrate de que tu modelo User tenga un campo 'role'
    //    y que los valores 'admin' y 'validador' sean los correctos.
    if (
      userMakingRequest.role === "admin" ||
      userMakingRequest.role === "validador"
    ) {
      console.log(
        `User ${requestingUserId} (Role: ${userMakingRequest.role}) granted admin/validator access to publication ${publicationId}.`
      );
      // Opcional: Si el admin necesita la publicación, cargarla aquí y adjuntarla a req
      // const publication = await Publicacion.findById(publicationId);
      // if (!publication) {
      //   return res.status(NOT_FOUND).json({ message: "Publicación no encontrada por el administrador." });
      // }
      // (req as any).publication = publication; // Si el controlador la espera
      return next(); // Los administradores/validadores pueden acceder
    }

    // 3. Si no es admin/validador, verificar si es el dueño de la publicación
    const publication = await Publicacion.findById(publicationId).select(
      "userId"
    ); // Solo necesitamos el userId de la publicación

    if (!publication) {
      return res
        .status(NOT_FOUND)
        .json({ message: "Publicación no encontrada." });
    }

    if (publication.userId.toString() === requestingUserId) {
      console.log(
        `User ${requestingUserId} is the owner of publication ${publicationId}, granting access.`
      );
      // (req as any).publication = publication; // Si el controlador la espera y no quieres que la busque de nuevo
      return next(); // El dueño puede acceder
    }

    // 4. Si no es admin/validador ni dueño, denegar acceso
    console.log(
      `User ${requestingUserId} (Role: ${userMakingRequest.role}) is neither admin/validator nor owner of publication ${publicationId}. Access denied.`
    );
    return res
      .status(FORBIDDEN)
      .json({ message: "You do not have permission to access this resource." });
  } catch (error) {
    console.error("Error in authorizePublicationAccess middleware:", error);
    res.status(500).json({ message: "Server error during authorization." });
  }
};
