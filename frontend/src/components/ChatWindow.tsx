import React, { useState, useEffect } from "react";

interface Message {
  senderId: string;
  content: string;
  timestamp: Date;
  read: boolean;
}

interface ChatWindowProps {
  conversationId: string;
  userId: string;
  onClose: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  conversationId,
  userId,
  onClose,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");

  // Cargar los mensajes de la conversación
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/getConversations/${conversationId}/messages`
        );
        if (!response.ok) {
          throw new Error("Error al cargar los mensajes");
        }
        const data: Message[] = await response.json();
        setMessages(data);
      } catch (error) {
        console.error(error);
      }
    };

    loadMessages();
  }, [conversationId]);

  const sendMessage = async () => {
    if (newMessage.trim() === "") return; // No enviar mensajes vacíos

    try {
      // Llamar al endpoint para enviar un mensaje
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/conversations/${conversationId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            senderId: userId,
            content: newMessage,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Error al enviar el mensaje");
      }

      const data: Message = await response.json();
      setMessages((prevMessages) => [...prevMessages, data]); // Agregar el mensaje a la lista
      setNewMessage(""); // Limpiar el campo de mensaje
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div style={styles.chatWindow}>
      <div style={styles.chatHeader}>
        <h3>Chat</h3>
        <button onClick={onClose} style={styles.closeButton}>
          Cerrar
        </button>
      </div>
      <div style={styles.chatBody}>
        {messages.map((message, index) => (
          <div
            key={index}
            style={{
              ...styles.message,
              alignSelf:
                message.senderId === userId ? "flex-end" : "flex-start",
              backgroundColor: message.senderId === userId ? "#dcf8c6" : "#fff",
            }}
          >
            <strong>{message.senderId}:</strong> {message.content}
          </div>
        ))}
      </div>
      <div style={styles.chatFooter}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Escribe un mensaje..."
          style={styles.input}
        />
        <button onClick={sendMessage} style={styles.sendButton}>
          Enviar
        </button>
      </div>
    </div>
  );
};

const styles = {
  chatWindow: {
    width: "300px",
    border: "1px solid #ccc",
    borderRadius: "8px",
    overflow: "hidden",
    margin: "10px",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#f9f9f9",
  },
  chatHeader: {
    padding: "10px",
    backgroundColor: "#007bff",
    color: "#fff",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  closeButton: {
    background: "none",
    border: "none",
    color: "#fff",
    cursor: "pointer",
  },
  chatBody: {
    flex: 1,
    padding: "10px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
  },
  message: {
    padding: "8px",
    margin: "4px",
    borderRadius: "8px",
    maxWidth: "80%",
  },
  chatFooter: {
    padding: "10px",
    borderTop: "1px solid #ccc",
    display: "flex",
  },
  input: {
    flex: 1,
    padding: "8px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    marginRight: "8px",
  },
  sendButton: {
    padding: "8px 16px",
    borderRadius: "4px",
    border: "none",
    backgroundColor: "#007bff",
    color: "#fff",
    cursor: "pointer",
  },
};

export default ChatWindow;
