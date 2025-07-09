"use client";

import { buttonVariants } from "@/components/ui/button";
import React, { useState } from "react";

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
}

const ContactForm: React.FC = () => {
  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    subject: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/contact`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      console.log(formData);

      const data = await res.json();
      if (res.ok) {
        setMessage(
          "Mensaje enviado con éxito!, proto resibiras una respuesta, por favor revisa tu email."
        );
        setFormData({ name: "", email: "", subject: "" });
      } else {
        setMessage(data.error || "Error al enviar el mensaje.");
      }
    } catch (error) {
      console.error("Ocurrió un error en el fetch de contacto:", error);
      setMessage("Error al enviar el mensaje. Por favor, intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto p-4 bg-white rounded-xl shadow space-y-4 mt-16"
    >
      <h2 className="text-2xl font-semibold text-center">Contáctanos</h2>

      <input
        type="text"
        name="name"
        value={formData.name}
        onChange={handleChange}
        placeholder="Nombre"
        required
        className="w-full p-2 border border-gray-300 rounded"
      />

      <input
        type="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        placeholder="Email"
        required
        className="w-full p-2 border border-gray-300 rounded"
      />

      <textarea
        name="subject"
        value={formData.subject}
        onChange={handleChange}
        placeholder="Asunto"
        required
        className="w-full p-2 border border-gray-300 rounded"
        rows={4}
      />

      <button
        type="submit"
        disabled={loading}
        className={`${buttonVariants()} w-full`}
      >
        {loading ? "Enviando..." : "Enviar"}
      </button>

      {message && <p className="text-center mt-2 text-sm">{message}</p>}
    </form>
  );
};

export default ContactForm;
