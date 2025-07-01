// src/routes/contact.route.ts

import { Router, Request, Response } from "express";
import { sendEmail } from "../services/email.service"; // Importamos nuestro servicio de Resend

const contactRouter = Router();

// Definimos la ruta POST para manejar los envíos del formulario
contactRouter.post("/", async (req: Request, res: Response) => {
  try {
    // 1. Extraemos los datos que envía el frontend del req.body
    const { name, email, subject } = req.body;

    // 2. Validación simple para asegurarnos de que los datos llegaron
    if (!name || !email || !subject) {
      return res
        .status(400)
        .json({ error: "Todos los campos son requeridos." });
    }

    console.log(`[Contact Form] Recibida solicitud de: ${name} <${email}>`);

    // 3. Preparamos el contenido del correo que te llegará A TI
    const emailSubject = `Nuevo Mensaje de Contacto de: ${name}`;
    const emailHtml = `
      <h1>Nuevo Mensaje desde tu Formulario de Contacto</h1>
      <p><strong>Nombre:</strong> ${name}</p>
      <p><strong>Email del remitente:</strong> ${email}</p>
      <hr>
      <h2>Mensaje:</h2>
      <p>${subject}</p>
    `;

    // 4. Usamos nuestro servicio 'sendEmail' para enviar el correo
    await sendEmail({
      // ¡OJO! El 'to' es TU correo, a donde quieres que lleguen los mensajes de contacto.
      to: "virtuallink777@gmail.com", // O el correo que prefieras para recibir notificaciones
      subject: emailSubject,
      html: emailHtml,
    });

    // 5. Respondemos al frontend con un mensaje de éxito
    console.log(`[Contact Form] Mensaje de ${name} enviado exitosamente.`);
    res.status(200).json({ message: "Mensaje enviado con éxito." });
  } catch (error) {
    console.error("[Contact Form] Error al procesar la solicitud:", error);
    // Respondemos al frontend con un mensaje de error genérico
    res
      .status(500)
      .json({ error: "Error interno del servidor al enviar el mensaje." });
  }
});

export default contactRouter;
