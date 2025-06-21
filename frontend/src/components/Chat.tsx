import React, { useEffect, useState } from "react";
import io from "socket.io-client";

// Inicializar el socket una sola vez
const socket = io(process.env.NEXT_PUBLIC_BACKEND_URL);

interface ChatProps {
  conversationId: string; // ID de la conversación
  userId: string; // ID del usuario actual (anónimo o dueño)
  ownerId: string; // ID del dueño de la publicidad
  onClose: () => void; // Función para cerrar el chat
}

const Chat: React.FC<ChatProps> = ({
  conversationId,
  userId,
  ownerId,
  onClose,
}) => {
  const [messages, setMessages] = useState<
    Array<{ senderId: string; content: string; timestamp: Date }>
  >([]);
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
    // Obtener la conversación guardada del sessionStorage
    const storedConversationId =
      sessionStorage.getItem("current_conversation") || conversationId;
    setActiveConversationId(storedConversationId);

    // Unir al usuario a su sala (room) usando su ID
    socket.emit("joinRoom", userId);
    console.log(`🔗 Usuario ${userId} unido a su sala privada.`);

    // Escuchar mensajes entrantes
    const handleNewMessage = (message: any) => {
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
  }, [conversationId, userId]);

  // Función para enviar un mensaje
  // Modificar la función de envío de mensajes para manejar notificaciones
  const sendMessage = (message: string) => {
    if (!message.trim()) return;

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
            <strong>{message.senderId === userId ? "Tú" : "Otro"}:</strong>{" "}
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
        <div className="offline-notification">
          <p className="text-red-800 text-center">
            El usuario dueño de la publicidad no está conectado... intenta mas
            tarde o por whatsapp
          </p>
        </div>
      )}
    </div>
  );
};

export default Chat;
