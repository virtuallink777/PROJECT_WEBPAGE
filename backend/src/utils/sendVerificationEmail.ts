import { transport } from "../config/nodemailer";
import { APP_ORIGIN } from "../constans/env";
import { UserDocument } from "../models/user.models";
import { VerificationCodeDocument } from "../models/vertificationCode.model";

export async function sendVerificationEmail(
  user: UserDocument,
  verificationCode: VerificationCodeDocument
) {
  try {
    // Construimos la URL de verificación usando la ruta del backend
    const url = `${APP_ORIGIN}/email/verify/${verificationCode._id}`;

    const info = await transport.sendMail({
      from: "negocios.caps@gmail.com",
      to: user.email,
      subject: "VERIFICACION DE EMAIL",
      text: `Por favor verifica tu correo electrónico haciendo clic en este enlace: ${url}`,
      html: `<h2>Por favor verifica tu correo electronico haciendo clic en este enlace: <a href="${url}">${url}Verificar Email</a></h2>`,
    });

    console.log("Message sent: %s", info.messageId);
    return true;
  } catch (error) {
    console.error("Error al enviar email:", error);
    throw error;
  }
}
