import React, { useEffect, useState } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:4004");

interface ChatProps {
  conversationId: string;
  userId: string;
  ownerId: string;
  onClose: () => void;
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

  useEffect(() => {
    // Obtener la conversación guardada
    const storedConversationId =
      sessionStorage.getItem("current_conversation") || conversationId;
    setActiveConversationId(storedConversationId);

    // Unir al usuario a su sala (room)
    socket.emit("joinRoom", userId);
    console.log(`🔗 Usuario ${userId} unido a su sala privada.`);

    // Escuchar mensajes entrantes
    socket.on("newMessage", (message) => {
      console.log("📩 Mensaje recibido del backend:", message);

      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages, message];
        sessionStorage.setItem(
          `chat_${storedConversationId}`,
          JSON.stringify(updatedMessages)
        );
        return updatedMessages;
      });
    });

    return () => {
      socket.off("newMessage");
    };
  }, [conversationId]);

  const sendMessage = (message: string) => {
    if (!message.trim()) return;

    const messageData = {
      conversationId: activeConversationId,
      senderId: userId, // Usuario actual
      receiverId: ownerId, // Dueño de la publicación
      content: message,
      timestamp: new Date().toISOString(),
    };

    console.log("📤 Enviando mensaje:", messageData);

    // Agregar mensaje al estado local
    setMessages((prevMessages) => {
      const updatedMessages = [...prevMessages, messageData];
      sessionStorage.setItem(
        `chat_${activeConversationId}`,
        JSON.stringify(updatedMessages)
      );
      return updatedMessages;
    });

    // Emitir el mensaje al backend
    socket.emit("sendMessage", messageData);

    setNewMessage(""); // Limpiar input después de enviar
  };

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
