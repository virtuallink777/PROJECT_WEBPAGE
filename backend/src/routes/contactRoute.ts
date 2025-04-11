import { Request, Response, Router } from "express";
import { GMAIL_SECRET } from "../constans/env";
import nodemailer from "nodemailer";

const router = Router();

router.post("/", async (request: Request, response: Response) => {
  const { name, email, subject } = request.body;

  if (!name || !email || !subject) {
    return response.status(400).json({ error: "Faltan datos" });
  }

  try {
    // Configura el transporte SMTP con tu cuenta de Gmail
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: "negocios.caps@gmail.com",
        pass: GMAIL_SECRET,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const mailOptions = {
      from: `"Formulario de contacto" <${process.env.GMAIL_USER}>`,
      to: "negocios.caps@gmail.com",
      subject: `Nuevo mensaje de ${name}`,
      html: `
        <h3>Nuevo mensaje desde el formulario de contacto</h3>
        <p><strong>Nombre:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Asunto:</strong></p>
        <p>${subject}</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    console.log(`📧 Email enviado correctamente desde ${email}`);
    return response
      .status(200)
      .json({ message: "Mensaje enviado correctamente." });
  } catch (error) {
    console.error("❌ Error al enviar el correo:", error);
    return response.status(500).json({ error: "Error al enviar el correo." });
  }
});

export default router;
