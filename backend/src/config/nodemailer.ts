import nodemailer from "nodemailer";
import { GMAIL_SECRET } from "../constans/env";

export const transport = nodemailer.createTransport({
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
