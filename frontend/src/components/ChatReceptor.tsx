import React, { useEffect, useState } from "react";
import io from "socket.io-client";

// Solo se inicializa una vez y se reutiliza en toda la aplicación
const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
  transports: ["websocket", "polling"],
  withCredentials: true,
  autoConnect: false, // Evita la conexión automática
});

interface ChatProps {
  userId: string; // El dueño de la publicidad (receptor)
}

interface Message {
  senderId: string;
  content: string;
  timestamp: Date;
}

const ChatReceptor: React.FC<ChatProps> = ({ userId }) => {
  // --- AÑADE ESTE CONSOLE.LOG AQUÍ ---
  console.log("--- CHAT RECEPTOR (DUEÑO) SE ESTÁ RENDERIZANDO ---");
  console.log("He recibido este userId:", userId);
  // --- FIN DEL AÑADIDO ---

  const [conversations, setConversations] = useState<{
    [conversationId: string]: Message[];
  }>({});
  const [openConversations, setOpenConversations] = useState<string[]>([]); // IDs de conversaciones abiertas
  const [inputMessages, setInputMessages] = useState<{
    [conversationId: string]: string;
  }>({}); // Inputs por conversación

  // Conectar al WebSocket y unirse a la sala del usuario
  useEffect(() => {
    if (!socket.connected) {
      console.log("Intentando conectar socket...");
      socket.connect();
    } else {
      // Si ya estaba conectado, nos aseguramos de unirnos a la sala
      console.log("Socket ya conectado. Asegurando unión a la sala.");
      socket.emit("joinRoom", userId);
    }

    const handleConnect = () => {
      console.log("✅ Conectado al WebSocket con ID:", socket.id);
      socket.emit("joinRoom", userId);
    };

    const handleError = (error: Error) => {
      console.error("🚨 Error de conexión al WebSocket:", error);
    };

    socket.on("connect", handleConnect);
    socket.on("connect_error", handleError);

    // --- ESTA ES LA PARTE MÁS IMPORTANTE ---
    // La función de retorno de useEffect se ejecuta cuando el componente se desmonta.
    // Es el lugar perfecto para limpiar.
    return () => {
      console.log(
        "Desmontando ChatReceptor. Limpiando listeners y desconectando socket."
      );
      socket.off("connect", handleConnect);
      socket.off("connect_error", handleError);

      // Le decimos al socket que se desconecte activamente del servidor.
      // Esto disparará el evento 'disconnect' en tu backend.
      socket.disconnect();
    };
  }, [userId]); // El array de dependencias está bien

  // Escuchar mensajes entrantes
  useEffect(() => {
    const handleMessage = (message: any) => {
      if (message.receiverId === userId) {
        console.log("Mensaje recibido:", message);

        // Actualizar el estado de las conversaciones
        setConversations((prevConversations) => ({
          ...prevConversations,
          [message.conversationId]: [
            ...(prevConversations[message.conversationId] || []),
            {
              senderId: message.senderId,
              content: message.content,
              timestamp: new Date(message.timestamp),
            },
          ],
        }));

        // Abrir una nueva ventana de chat si la conversación no está abierta
        if (!openConversations.includes(message.conversationId)) {
          setOpenConversations((prev) => [...prev, message.conversationId]);
        }
      }
    };

    socket.on("newMessage", handleMessage);

    return () => {
      socket.off("newMessage", handleMessage);
    };
  }, [userId, openConversations]);

  // Enviar un mensaje
  const sendMessage = (conversationId: string) => {
    const message = inputMessages[conversationId];
    if (!message?.trim()) {
      console.error("🚨 El mensaje está vacío.");
      return;
    }

    const messageData = {
      conversationId,
      senderId: userId, // ID del dueño
      receiverId: conversations[conversationId][0].senderId, // ID del cliente
      content: message,
      timestamp: new Date().toISOString(),
    };

    console.log("📤 Enviando mensaje desde el owner:", messageData);

    // Actualizar el estado local de las conversaciones
    setConversations((prevConversations) => ({
      ...prevConversations,
      [conversationId]: [
        ...(prevConversations[conversationId] || []),
        {
          senderId: userId,
          content: message,
          timestamp: new Date(),
        },
      ],
    }));

    // Enviar el mensaje al servidor
    socket.emit("sendMessage", messageData, (response: any) => {
      if (response && response.success) {
        console.log("✅ Mensaje enviado correctamente.");
      } else {
        console.error("🚨 Error al enviar el mensaje:", response?.error);
      }
    });

    // Limpiar el input
    setInputMessages((prev) => ({ ...prev, [conversationId]: "" }));
  };

  // Borrar mensajes de una conversación
  const clearMessages = (conversationId: string) => {
    setConversations((prevConversations) => ({
      ...prevConversations,
      [conversationId]: [],
    }));
  };

  // Cerrar una conversación
  const closeConversation = (conversationId: string) => {
    setOpenConversations((prev) => prev.filter((id) => id !== conversationId));
  };

  return (
    <>
      {openConversations.map((conversationId, index) => {
        // Cálculo simple y responsivo para la posición
        const basePosition = index * (window.innerWidth > 768 ? 320 : 0);
        const rightPosition =
          window.innerWidth > 768 ? `${basePosition}px` : `${index * 10}px`;
        const width =
          window.innerWidth > 768
            ? "320px"
            : `calc(100% - ${Math.min(index * 20, 80)}px)`;
        const bottomPosition =
          window.innerWidth > 768 ? "0px" : `${index * 50}px`;

        return (
          <div
            key={conversationId}
            className="fixed bottom-0 right-0 bg-white shadow-lg rounded-t-lg z-50 m-2"
            style={{
              right: rightPosition,
              width: width,
              bottom: bottomPosition,
              maxWidth: "384px", // Equivalente a w-96
            }}
          >
            <div className="bg-blue-500 text-white p-4 rounded-t-lg flex justify-between">
              <span>Chat en vivo ({conversationId.slice(0, 6)})</span>
              <button
                onClick={() => closeConversation(conversationId)}
                className="text-white hover:text-gray-200"
              >
                Cerrar
              </button>
            </div>

            <div className="p-4 h-80 overflow-y-auto">
              {conversations[conversationId]?.map((message, index) => (
                <div
                  key={index}
                  className={`mb-2 p-1 ${
                    message.senderId === userId
                      ? "text-right bg-blue-50 rounded"
                      : "bg-gray-50 rounded"
                  }`}
                >
                  <strong>
                    {message.senderId === userId ? "Tú" : "Cliente"}:
                  </strong>{" "}
                  {message.content}
                </div>
              ))}
            </div>

            <div className="p-4 border-t">
              <input
                type="text"
                placeholder="Escribe un mensaje..."
                value={inputMessages[conversationId] || ""}
                onChange={(e) =>
                  setInputMessages((prev) => ({
                    ...prev,
                    [conversationId]: e.target.value,
                  }))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    sendMessage(conversationId);
                  }
                }}
                className="w-full p-2 border rounded mb-2"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => sendMessage(conversationId)}
                  className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
                >
                  Enviar
                </button>
                <button
                  onClick={() => clearMessages(conversationId)}
                  className="w-full bg-red-500 text-white p-2 rounded hover:bg-red-600"
                >
                  Borrar
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
};

export default ChatReceptor;
