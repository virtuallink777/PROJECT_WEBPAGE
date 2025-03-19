import React, { useEffect, useState } from "react";
import io from "socket.io-client";

// Solo se inicializa una vez y se reutiliza en toda la aplicación
const socket = io("http://localhost:4004", {
  transports: ["websocket", "polling"],
  withCredentials: true,
  autoConnect: false, // Evita la conexión automática
});

interface ChatProps {
  userId: string; // El dueño de la publicidad (receptor)
  clientId: string; // El cliente que envía el mensaje
}

const ChatReceptor: React.FC<ChatProps> = ({ userId, clientId }) => {
  const [messages, setMessages] = useState<
    Array<{ senderId: string; content: string; timestamp: Date }>
  >([]);
  const [newMessage, setNewMessage] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  useEffect(() => {
    if (!socket.connected) {
      socket.connect(); // Conectar manualmente si no está conectado
    }

    socket.on("connect", () => {
      console.log("✅ Conectado al WebSocket");
      socket.emit("joinRoom", userId);
    });

    return () => {
      socket.off("connect");
    };
  }, [userId]);

  useEffect(() => {
    const handleMessage = (message: any) => {
      if (message.receiverId === userId) {
        console.log("Mensaje recibido:", message);

        sessionStorage.setItem("senderId", message.senderId); // Guardamos el senderId en el sessionStorage
        setConversationId(message.conversationId);
        setIsChatOpen(true);

        setMessages((prevMessages) => {
          const updatedMessages = [...prevMessages, message];
          sessionStorage.setItem(
            `chat_${message.conversationId}`,
            JSON.stringify(updatedMessages)
          );
          return updatedMessages;
        });
      }
    };

    socket.off("newMessage", handleMessage);
    socket.on("newMessage", handleMessage);

    return () => {
      socket.off("newMessage", handleMessage);
    };
  }, [userId]);

  const sendMessage = (message: string) => {
    if (!message.trim() || !conversationId) return;

    if (!clientId) {
      console.error(
        "🚨 Error: clientId está vacío antes de enviar el mensaje."
      );
      return;
    }

    const messageData = {
      conversationId,
      senderId: userId,
      receiverId: clientId, // Asegúrate de que sea el ID correcto
      content: message,
      timestamp: new Date().toISOString(),
    };

    console.log("📤 Enviando mensaje desde el owner:", messageData);
    console.log("senderId", userId);
    console.log("receiverId", clientId);

    setMessages((prevMessages) => {
      const updatedMessages = [...prevMessages, messageData];
      sessionStorage.setItem(
        `chat_${conversationId}`,
        JSON.stringify(updatedMessages)
      );
      return updatedMessages;
    });

    socket.emit("sendMessage", messageData);
    setNewMessage("");
  };

  const clearChat = () => {
    setMessages([]); // Limpiar el estado local
    sessionStorage.removeItem(`chat_${conversationId}`); // Eliminar del sessionStorage
  };

  return (
    <>
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-5 right-5 bg-blue-500 text-white p-3 rounded-full shadow-lg"
        >
          Abrir Chat
        </button>
      )}

      {isChatOpen && (
        <div className="fixed bottom-0 right-0 w-96 bg-white shadow-lg rounded-t-lg z-50">
          <div className="bg-blue-500 text-white p-4 rounded-t-lg flex justify-between">
            <span>Chat en vivo</span>
            <button
              onClick={() => setIsChatOpen(false)}
              className="text-white hover:text-gray-200"
            >
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
      )}
    </>
  );
};

export default ChatReceptor;
