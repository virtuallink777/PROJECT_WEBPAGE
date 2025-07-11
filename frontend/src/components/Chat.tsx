import { useSocketContext } from "@/context/SocketContext";
import React, { useEffect, useState } from "react";
//import io from "socket.io-client";

// Inicializar el socket una sola vez
//const socket = io(process.env.NEXT_PUBLIC_SOCKET_UR);

// Primero, definamos el tipo para el evento para que sea reutilizable
type MetricEventType = "click" | "whatsappClicks" | "liveChatClicks";

interface ChatProps {
  conversationId: string; // ID de la conversación
  userId: string | null; // ID del usuario actual (anónimo o dueño)
  ownerId: string; // ID del dueño de la publicidad
  onClose: () => void; // Función para cerrar el chat
  postId?: string; // ID del post (opcional, si es necesario)
  // 👇 ESTA ES LA LÍNEA CORREGIDA 👇
  // La función espera el ID del post y el tipo de evento
  onliveChatClicks: (postId: string, eventType: MetricEventType) => void;
}

interface Message {
  conversationId: string;
  senderId: string;
  receiverId: string; // <-- Importante, este campo no lo habíamos adivinado
  content: string; // <-- Se llama 'content', no 'text'
  timestamp: string; // <-- Se llama 'timestamp', no 'createdAt'
  // No hay un campo '_id' en el mensaje que llega por socket
}

const Chat: React.FC<ChatProps> = ({
  conversationId,
  userId,
  ownerId,
  onClose,
}) => {
  // NUEVO -> Obtenemos el socket ÚNICO desde el contexto
  const { socket } = useSocketContext();

  // 👇 TIPA EL ESTADO AQUÍ, con la interfaz correcta
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [activeConversationId, setActiveConversationId] =
    useState(conversationId);

  // Nuevo estado para manejar notificaciones de usuario desconectado
  const [offlineNotification, setOfflineNotification] = useState<{
    receiverId: string;
    message: string;
  } | null>(null);

  // Efecto para manejar la conexión y los mensajes
  useEffect(() => {
    // NUEVO -> Condición de seguridad, no hacer nada si el socket no está listo
    if (!socket) return;

    // Obtener la conversación guardada del sessionStorage
    const storedConversationId =
      sessionStorage.getItem("current_conversation") || conversationId;
    setActiveConversationId(storedConversationId);

    // Unir al usuario a su sala (room) usando su ID
    socket.emit("joinRoom", userId);
    console.log(`🔗 Usuario ${userId} unido a su sala privada.`);

    // Escuchar mensajes entrantes
    const handleNewMessage = (message: Message) => {
      console.log("📩 Mensaje recibido del backend:", message);

      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages, message];
        sessionStorage.setItem(
          `chat_${storedConversationId}`,
          JSON.stringify(updatedMessages)
        );
        return updatedMessages;
      });
    };

    // Nuevo manejador para usuarios desconectados
    const handleUserOffline = (offlineInfo: {
      receiverId: string;
      conversationId: string;
      message: string;
    }) => {
      console.log("Usuario receptor no conectado:", offlineInfo);

      // Mostrar notificación de usuario desconectado
      setOfflineNotification({
        receiverId: offlineInfo.receiverId,
        message: offlineInfo.message,
      });

      // Opcional: Guardar el mensaje para entrega posterior
      // Puedes implementar una lógica para guardar mensajes no entregados
    };

    // Escuchar eventos de socket
    socket.on("newMessage", handleNewMessage);
    socket.on("userOffline", handleUserOffline);

    // Limpiar listeners al desmontar
    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("userOffline", handleUserOffline);
    };
  }, [conversationId, userId, socket]);

  // Función para enviar un mensaje
  // Modificar la función de envío de mensajes para manejar notificaciones
  const sendMessage = (message: string) => {
    // NUEVO -> Condición de seguridad
    if (!socket || !message.trim()) return;

    let receiverId = ownerId;

    if (userId === ownerId) {
      const otherMessage = messages.find((msg) => msg.senderId !== userId);
      if (otherMessage) {
        receiverId = otherMessage.senderId;
      }
    }

    const messageData = {
      conversationId: activeConversationId,
      senderId: userId,
      receiverId: receiverId,
      content: message,
      timestamp: new Date().toISOString(),
    };

    console.log("📤 Enviando mensaje:", messageData);

    // Actualizar mensajes locales
    setMessages((prevMessages) => {
      const updatedMessages = [...prevMessages, messageData];
      sessionStorage.setItem(
        `chat_${activeConversationId}`,
        JSON.stringify(updatedMessages)
      );
      return updatedMessages;
    });

    // Enviar mensaje
    socket.emit("sendMessage", messageData);
    setNewMessage("");
  };

  // Función para limpiar la conversación
  const clearChat = () => {
    setMessages([]); // Limpiar mensajes locales
    sessionStorage.removeItem(`chat_${activeConversationId}`); // Limpiar mensajes guardados en sessionStorage
  };

  // Función para limpiar la notificación de usuario desconectado
  const clearOfflineNotification = () => {
    setOfflineNotification(null);
  };

  return (
    <div className="fixed bottom-0 right-0 w-96 bg-white shadow-lg rounded-t-lg z-50">
      <div className="bg-blue-500 text-white p-4 rounded-t-lg flex justify-between">
        <span>Chat en vivo</span>
        <button onClick={onClose} className="text-white hover:text-gray-200">
          Cerrar
        </button>
      </div>

      <div className="p-4 h-80 overflow-y-auto">
        {messages.map((message, index) => (
          <div key={index} className="mb-2">
            <strong>{message.senderId === userId ? "Tú" : "Modelo"}:</strong>{" "}
            {message.content}
          </div>
        ))}
      </div>

      <div className="p-4 border-t">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage(newMessage)}
          className="w-full p-2 border rounded"
          placeholder="Escribe un mensaje..."
        />
        <button
          onClick={() => sendMessage(newMessage)}
          className="mt-2 w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          Enviar
        </button>
        <button
          onClick={clearChat}
          className="mt-2 w-full bg-blue-300 text-white p-2 rounded hover:bg-blue-400"
        >
          Borrar conversación
        </button>
      </div>
      {/* Mostrar notificación de usuario desconectado */}
      {offlineNotification && (
        // He añadido clases de estilo para que la notificación sea más visible y esté mejor posicionada
        <div
          className="offline-notification bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 m-4 rounded-md relative"
          role="alert"
        >
          <p>
            {offlineNotification.message ||
              "El usuario no está conectado en este momento."}
          </p>

          {/* 👇 ESTE ES EL BOTÓN QUE SOLUCIONA EL ERROR 👇 */}
          <button
            onClick={clearOfflineNotification} // Llama a la función que limpia la notificación
            className="absolute top-0 right-0 mt-1 mr-2 text-yellow-800 hover:text-yellow-600 font-bold text-lg"
            aria-label="Cerrar notificación"
          >
            × {/* Este es el caracter de la 'X' para cerrar */}
          </button>
        </div>
      )}
    </div>
  );
};

export default Chat;
