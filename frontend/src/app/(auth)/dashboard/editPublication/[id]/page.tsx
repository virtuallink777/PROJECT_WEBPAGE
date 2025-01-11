"use client";

import { FirstBlockPublication } from "@/components/FirstBlockPublication";
import { Button } from "@/components/ui/button";
import { useParams, useRouter } from "next/navigation";

import React, { useState, useEffect } from "react";

interface FormData {
  nombre: string;
  edad: string;
  telefono: string;
}

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const EditPublication: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    nombre: "",
    edad: "",
    telefono: "",
  });
  const [errors, setErrors] = useState<Record<keyof FormData, string>>({
    nombre: "",
    edad: "",
    telefono: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { id } = useParams();
  const router = useRouter();

  useEffect(() => {
    const fetchPublication = async () => {
      try {
        const response = await fetch(`${API_URL}/api/editPublications/${id}`);
        if (!response.ok) throw new Error("No se pudo obtener la publicación");

        const data = await response.json();
        setFormData({
          nombre: data.nombre || "",
          edad: data.edad || "",
          telefono: data.telefono || "",
        });
      } catch (err) {
        console.error("Error al obtener la publicación:", err);
      }
    };

    fetchPublication();
  }, [id]);

  const handleFormChange = (name: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/updatePublications/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Error al actualizar la publicación");

      alert("Publicación actualizada exitosamente");

      router.push("/dashboard/viewPublications");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-8 py-8">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="container mx-auto px-8 py-8">
          <div>
            <FirstBlockPublication
              formData={formData}
              errors={errors}
              onFormChange={handleFormChange}
            />

            {error && <div className="mt-4 text-red-600">{error}</div>}

            <div className="mt-6 flex justify-center">
              <Button
                type="submit"
                disabled={isSubmitting}
                className={`"min-w-[20rem]"
              ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {isSubmitting ? "Guardando..." : "Guardar cambios"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPublication;
