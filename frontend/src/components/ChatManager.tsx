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
  clientId: string | null; // Opcional, si se necesita para el cliente
}

// Interfaz para la respuesta del callback del socket
interface SocketResponse {
  success: boolean;
  error?: string; // La '?' hace que la propiedad 'error' sea opcional
}

// Esta es la forma del mensaje que llega por el socket
interface IncomingMessage {
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
}

// Esta es la forma del mensaje que guardaremos en nuestro estado local
interface StoredMessage {
  senderId: string;
  content: string;
  timestamp: Date; // Guardarlo como objeto Date es más útil
}

const ChatManager: React.FC<ChatProps> = ({ userId }) => {
  // --- AÑADE ESTE CONSOLE.LOG AQUÍ ---
  console.log("--- CHAT RECEPTOR (DUEÑO) SE ESTÁ RENDERIZANDO ---");
  console.log("He recibido este userId:", userId);
  // --- FIN DEL AÑADIDO ---

  const [conversations, setConversations] = useState<{
    [conversationId: string]: StoredMessage[];
  }>({});
  //const [openConversations, setOpenConversations] = useState<string[]>([]); // IDs de conversaciones abiertas
  const [inputMessages, setInputMessages] = useState<{
    [conversationId: string]: string;
  }>({}); // Inputs por conversación

  // 👇 AÑADE ESTE NUEVO ESTADO 👇
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);

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
    const handleMessage = (message: IncomingMessage) => {
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
      }
    };

    socket.on("newMessage", handleMessage);

    return () => {
      socket.off("newMessage", handleMessage);
    };
  }, [userId]);

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
    socket.emit("sendMessage", messageData, (response: SocketResponse) => {
      if (response && response.success) {
        console.log("✅ Mensaje enviado correctamente.");
      } else {
        console.error("🚨 Error al enviar el mensaje:", response?.error);
      }
    });

    // Limpiar el input
    setInputMessages((prev) => ({ ...prev, [conversationId]: "" }));
  };

  return (
    // --- CONTENEDOR PRINCIPAL DEL CHAT ---
    // Fijo en la esquina inferior derecha en escritorio, pantalla completa en móvil
    <div
      className="fixed bottom-0 right-0 z-50
                 w-full h-full md:w-96 md:h-auto md:max-h-[70vh] md:bottom-4 md:right-4
                 bg-white shadow-lg rounded-lg flex flex-col"
    >
      {/* --- HEADER --- */}
      <div className="bg-blue-500 text-white p-4 rounded-t-lg flex items-center">
        {activeConversationId && (
          // Botón de "Atrás" si estamos en una conversación
          <button
            onClick={() => setActiveConversationId(null)}
            className="mr-4 font-bold text-xl"
          >
            ←
          </button>
        )}
        <span className="font-bold">
          {activeConversationId
            ? `Chat con Cliente (${activeConversationId.slice(-6)})`
            : "Tus Conversaciones"}
        </span>
      </div>

      {/* --- VISTA CONDICIONAL: LISTA O MENSAJES --- */}
      <div className="flex-1 overflow-y-auto">
        {!activeConversationId ? (
          // --- VISTA: LISTA DE CONVERSACIONES ---
          <div>
            {Object.keys(conversations).map((convoId) => (
              <div
                key={convoId}
                onClick={() => setActiveConversationId(convoId)}
                className="p-4 border-b hover:bg-gray-100 cursor-pointer"
              >
                <p className="font-semibold">Cliente ({convoId.slice(-6)})</p>
                <p className="text-sm text-gray-500 truncate">
                  {/* Opcional: Mostrar último mensaje */}
                  {
                    conversations[convoId][conversations[convoId].length - 1]
                      ?.content
                  }
                </p>
              </div>
            ))}
            {Object.keys(conversations).length === 0 && (
              <p className="p-4 text-center text-gray-500">
                No tienes conversaciones activas.
              </p>
            )}
          </div>
        ) : (
          // --- VISTA: MENSAJES DE UNA CONVERSACIÓN ---
          <div className="p-4 flex flex-col h-full">
            {/* Contenedor de mensajes (ocupa el espacio sobrante) */}
            <div className="flex-1 overflow-y-auto mb-4">
              {conversations[activeConversationId]?.map((message, index) => (
                <div
                  key={index}
                  className={`mb-2 p-2 rounded-lg max-w-[80%] ${
                    message.senderId === userId
                      ? "bg-blue-500 text-white self-end"
                      : "bg-gray-200 text-black self-start"
                  }`}
                >
                  {message.content}
                </div>
              ))}
            </div>

            {/* Input y botón de enviar (pegado abajo) */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Escribe un mensaje..."
                value={inputMessages[activeConversationId] || ""}
                onChange={(e) =>
                  setInputMessages((prev) => ({
                    ...prev,
                    [activeConversationId]: e.target.value,
                  }))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendMessage(activeConversationId);
                }}
                className="flex-1 p-2 border rounded"
              />
              <button
                onClick={() => sendMessage(activeConversationId)}
                className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
              >
                Enviar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatManager;
