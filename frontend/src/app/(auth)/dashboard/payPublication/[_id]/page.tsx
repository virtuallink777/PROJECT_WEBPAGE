"use client";

import PSEPaymentButton from "@/components/PSEPaymentButton";
import PricingTable from "@/components/TableValuesPublication";
import TimePicker from "@/components/TimePicker";
import api from "@/lib/api";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";

const PayPublication = () => {
  // state for select cell
  const [selectedPricing, setSelectedPricing] = useState<{
    hours: string;
    days: string;
    price: number;
  } | null>(null);
  // state for select time
  const [selectedTime, setSelectedTime] = useState(""); // Estado para la hora seleccionada

  const _idParams = useParams();
  const id = _idParams._id as string; // Obtener el ID de la URL

  // traemos la publicacion por id

  const addPublication = async (id: string) => {
    if (!id) {
      console.error("ID de publicación no proporcionado");
      return;
    }
    try {
      const response = await api.get(`/api/editPublications/${id}`);

      // Verificar si la respuesta es exitosa
      console.log("Datos de la publicación obtenida:", response.data);
    } catch (error) {
      console.error(
        "[addPublication] Error capturado en el componente:",
        error
      );

      // PASO 2: Verificamos primero si es un error de Axios
      if (axios.isAxiosError(error)) {
        // Si entramos aquí, TypeScript sabe que 'error' es un AxiosError.

        // Tu lógica original para diferenciar 401 de otros errores de Axios:
        if (error.response?.status === 401) {
          console.log(
            "[addPublication Component Catch] Error 401 manejado por el interceptor. No se mostrará alert adicional."
          );
          // No hacemos nada, el interceptor ya redirigió.
        } else {
          // Es otro error de Axios (404, 500, etc.)
          console.log(
            "[addPublication Component Catch] Error de Axios (no 401), mostrando alert."
          );
          const displayMessage =
            error.response?.data?.message ||
            error.message ||
            `Error del servidor: ${error.response?.status}`;
          alert(displayMessage);
        }
      } else if (error instanceof Error) {
        // PASO 3: Si no fue de Axios, verificamos si es un error estándar de JS.
        // Esto podría ser el error que lanzas desde tu interceptor.
        console.log(
          "[addPublication Component Catch] Error genérico (no de Axios), mostrando alert."
        );
        alert(error.message);
      } else {
        // PASO 4: Si no es ni de Axios ni un Error, es algo inesperado.
        console.log(
          "[addPublication Component Catch] Error de tipo desconocido, mostrando alert genérico."
        );
        alert("Ocurrió un error inesperado al obtener los detalles.");
      }
    } finally {
      // setLoading(false);
    }
  };

  // Llamar a la función para obtener la publicación al cargar el componente
  useEffect(() => {
    // Asegúrate que 'id' (el ID de la publicación a cargar) esté disponible aquí.
    // Ejemplo: si 'id' viene de router.query o de un estado.
    // const publicationIdToLoad = id; // Asumiendo que 'id' es la variable correcta

    if (id) {
      // Solo llama si 'id' tiene un valor
      addPublication(id);
    } else {
      console.log(
        "[useEffect addPublication] No hay ID para cargar la publicación al montar."
      );
      // Podrías querer manejar este caso, ej. mostrando un mensaje o no haciendo nada.
    }
  }, [id]); // Ejecutar cuando 'id' cambie (y al montar si 'id' ya tiene valor)

  const handlePayment = async () => {
    if (!selectedPricing || !selectedTime) {
      alert("Por favor selecciona todos los campos antes de pagar.");
      return;
    }

    try {
      // Generar datos de transacción

      const now = new Date();
      const transactionDate = now.toLocaleDateString();
      const transactionTime = now.toLocaleTimeString();

      // Crear objeto de datos
      const paymentData = {
        selectedPricing,
        selectedTime,
        status: true,

        transactionDate,
        transactionTime,
      };

      console.log("Datos de pago:", paymentData);

      // Guarda temporalmente en sessionStorage y el id de la publicacion
      sessionStorage.setItem("publicationId", id);
      sessionStorage.setItem("pendingPaymentData", JSON.stringify(paymentData));

      // Enviar datos al servidor
    } catch (error) {
      console.error("Error al enviar los datos de pago:", error);
    }
  };

  return (
    <>
      <div>
        <PricingTable onSelect={setSelectedPricing} />

        {/* Renderizamos la selección aquí */}
        {selectedPricing && (
          <div className="mt-4 p-4 bg-blue-100 text-blue-800 text-center rounded-lg">
            <strong>Seleccionaste:</strong> {selectedPricing.hours} -{" "}
            {selectedPricing.days}
            <br /> Precio:{" "}
            <span className="font-bold text-green-600">
              ${selectedPricing.price.toLocaleString()}
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-col items-center justify-center mt-8">
        <TimePicker
          selectedTime={selectedTime}
          onTimeChange={setSelectedTime}
        />
        {/* Mostrar la hora seleccionada */}
        {selectedTime && (
          <p className="mt-4 text-lg font-semibold text-gray-700 items-center">
            Escogiste desde la(s):{" "}
            <span className="text-blue-500 text-center">{selectedTime}</span>
          </p>
        )}

        {/* Sección de método de pago */}
        <div className="mt-8 p-6 bg-white shadow-md rounded-lg text-center mb-8">
          <h3>PAGA POR OPENPAY</h3>
          {selectedPricing && (
            <PSEPaymentButton
              selectedPricing={selectedPricing}
              selectedTime={selectedTime}
              handlePayment={handlePayment}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default PayPublication;
