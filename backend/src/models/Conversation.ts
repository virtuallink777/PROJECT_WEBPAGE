import { Schema, model, Document } from "mongoose";

// Definimos la interfaz para los mensajes
interface IMessage {
  senderId: string; // ID del remitente (cliente o creador)
  content: string; // Contenido del mensaje
  timestamp: Date; // Fecha y hora del mensaje
  read: boolean; // Indica si el mensaje ha sido leído
}

// Definimos la interfaz para la conversación
interface IConversation extends Document {
  publicationId: string; // ID de la publicación relacionada
  ownerId: string; // ID del creador de la publicación
  clientId: string; // ID del cliente que inicia el chat
  messages: IMessage[]; // Array de mensajes
  createdAt: Date; // Fecha de creación del chat
  updatedAt: Date; // Fecha de la última actualización del chat
}

// Definimos el esquema de MongoDB para los mensajes
const MessageSchema = new Schema<IMessage>({
  senderId: { type: String, required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  read: { type: Boolean, default: false },
});

// Definimos el esquema de MongoDB para la conversación
const ConversationSchema = new Schema<IConversation>({
  publicationId: { type: String, required: true },
  ownerId: { type: String, required: true },
  clientId: { type: String, required: true },
  messages: [MessageSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Creamos el modelo de MongoDB para la conversación
const Conversation = model<IConversation>("Conversation", ConversationSchema);

export { Conversation, IConversation, IMessage };
