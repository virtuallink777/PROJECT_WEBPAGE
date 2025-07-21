// src/components/ChatManager.tsx
"use client";

import React from "react";

// Estas son las "formas" de los datos que este componente necesita saber
interface StoredMessage {
  senderId: string;
  content: string;
  timestamp: Date;
}

interface ChatManagerProps {
  currentUserId: string;
  conversations: { [conversationId: string]: StoredMessage[] };
  activeConversationId: string | null;
  inputMessages: { [conversationId: string]: string };
  onClose: () => void;
  onSendMessage: (conversationId: string) => void;
  onSetActiveConversation: (id: string | null) => void;
  onInputChange: (conversationId: string, value: string) => void;
  onClearChat: (conversationId: string) => void;
  unreadConversations: { [convoId: string]: boolean };
}

const ChatManager: React.FC<ChatManagerProps> = ({
  currentUserId,
  conversations,
  activeConversationId,
  inputMessages,
  onClose,
  onSendMessage,
  onSetActiveConversation,
  onInputChange,
  onClearChat,
  unreadConversations, // Añadido para manejar conversaciones no leídas
}) => {
  // Este componente ya no tiene lógica de estado ni de sockets.
  // Es solo una "pantalla" que muestra los datos que le pasa su padre.

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[calc(100%-2rem)] max-w-sm h-[70vh] md:w-96 md:h-auto md:max-h-[70vh] bg-white shadow-lg rounded-lg flex flex-col">
      {/* --- HEADER --- */}
      <div className="bg-blue-500 text-white p-4 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center">
          {activeConversationId && (
            <button
              onClick={() => onSetActiveConversation(null)}
              className="mr-2 font-bold text-xl hover:bg-blue-600 rounded-full w-8 h-8"
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
        <button
          onClick={onClose}
          className="font-bold text-xl hover:bg-blue-600 rounded-full w-8 h-8"
        >
          ×
        </button>
      </div>

      {/* --- VISTA CONDICIONAL: LISTA O MENSAJES --- */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {!activeConversationId ? (
          // --- VISTA: LISTA DE CONVERSACIONES ---
          <div>
            {Object.keys(conversations).map((convoId) => (
              <div
                key={convoId}
                onClick={() => onSetActiveConversation(convoId)}
                className={`p-4 border-b hover:bg-gray-100 cursor-pointer ${
                  unreadConversations[convoId] ? "bg-red-50" : ""
                }`}
              >
                <p className="font-semibold">Cliente ({convoId.slice(-6)})</p>
                <p className="text-sm text-gray-500 truncate">
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
            <div className="flex-1 overflow-y-auto mb-4 flex flex-col gap-2">
              {conversations[activeConversationId]?.map((message, index) => (
                <div
                  key={index}
                  className={`p-2 rounded-lg max-w-[80%] ${
                    message.senderId === currentUserId
                      ? "bg-blue-500 text-white self-end"
                      : "bg-gray-200 text-black self-start"
                  }`}
                >
                  {message.content}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Escribe un mensaje..."
                value={inputMessages[activeConversationId] || ""}
                onChange={(e) =>
                  onInputChange(activeConversationId, e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") onSendMessage(activeConversationId);
                }}
                className="flex-1 p-2 border rounded"
              />
              <button
                onClick={() => onSendMessage(activeConversationId)}
                className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
              >
                Enviar
              </button>
            </div>
            <button
              onClick={() => onClearChat(activeConversationId)}
              className="mt-2 w-full bg-gray-300 text-gray-700 p-2 rounded hover:bg-gray-400 text-sm"
            >
              Borrar esta conversación
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatManager;
