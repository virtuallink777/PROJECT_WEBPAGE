// src/services/email.service.ts

import { Resend } from "resend";

// 1. Inicializamos Resend una sola vez con la API Key de nuestras variables de entorno.
const resend = new Resend(process.env.RESEND_API_KEY);

// 2. Definimos una interfaz para las opciones que necesitará nuestra función.
//    Esto nos ayuda con el autocompletado y a evitar errores.
interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

// 3. Creamos y exportamos la función que usaremos en toda nuestra aplicación.
export async function sendEmail({ to, subject, html }: EmailOptions) {
  try {
    console.log(`[Email Service] Preparando para enviar correo a: ${to}`);

    const { data, error } = await resend.emails.send({
      from: "Lujuria <no-reply@prepagoslujuria.com>",
      to: [to],
      subject: subject,
      html: html,
    });

    if (error) {
      // Si Resend devuelve un error, lo registramos y lo lanzamos para que se maneje más arriba.
      console.error("[Email Service] Error devuelto por Resend:", error);
      throw error;
    }

    console.log("[Email Service] Correo enviado exitosamente. ID:", data?.id);
    return data;
  } catch (error) {
    // Capturamos cualquier otro error (ej. de red) y lo relanzamos.
    console.error("[Email Service] Error inesperado al enviar correo:", error);
    throw error;
  }
}
