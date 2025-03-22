import React, { useEffect, useState } from "react";
import io from "socket.io-client";

// Inicializar el socket una sola vez
const socket = io("http://localhost:4004");

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

      // Actualizar el estado de los mensajes
      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages, message];
        sessionStorage.setItem(
          `chat_${storedConversationId}`,
          JSON.stringify(updatedMessages)
        );
        return updatedMessages;
      });
    };

    socket.on("newMessage", handleNewMessage);

    // Limpiar el listener al desmontar el componente
    return () => {
      socket.off("newMessage", handleNewMessage);
    };
  }, [conversationId, userId]);

  // Función para enviar un mensaje
  const sendMessage = (message: string) => {
    if (!message.trim()) return; // No enviar mensajes vacíos

    // Determinar el receptor del mensaje
    let receiverId = ownerId; // Por defecto, el receptor es el dueño

    // Si el usuario actual es el dueño, responder al cliente
    if (userId === ownerId) {
      const otherMessage = messages.find((msg) => msg.senderId !== userId);
      if (otherMessage) {
        receiverId = otherMessage.senderId; // Responder al cliente que inició la conversación
      }
    }

    // Crear el objeto del mensaje
    const messageData = {
      conversationId: activeConversationId,
      senderId: userId,
      receiverId: receiverId,
      content: message,
      timestamp: new Date().toISOString(),
    };

    console.log("📤 Enviando mensaje:", messageData);

    // Actualizar el estado local de los mensajes
    setMessages((prevMessages) => {
      const updatedMessages = [...prevMessages, messageData];
      sessionStorage.setItem(
        `chat_${activeConversationId}`,
        JSON.stringify(updatedMessages)
      );
      return updatedMessages;
    });

    // Enviar el mensaje al servidor
    socket.emit("sendMessage", messageData);

    // Limpiar el input después de enviar
    setNewMessage("");
  };

  // Función para limpiar el chat
  const clearChat = () => {
    setMessages([]); // Limpiar el estado local
    sessionStorage.removeItem(`chat_${activeConversationId}`); // Eliminar del sessionStorage
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
    </div>
  );
};

export default Chat;
