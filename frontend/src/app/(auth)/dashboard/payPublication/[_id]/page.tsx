"use client";

import PSEPaymentButton from "@/components/PSEPaymentButton";
import PricingTable from "@/components/TableValuesPublication";
import TimePicker from "@/components/TimePicker";
import api from "@/lib/api";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import { AxiosError } from "axios";

const PayPublication = () => {
  // state for select cell
  const [selectedPricing, setSelectedPricing] = useState<{
    hours: string;
    days: string;
    price: number;
  } | null>(null);
  // state for select time
  const [selectedTime, setSelectedTime] = useState(""); // Estado para la hora seleccionada

  const [Publicacion, setPublicacion] = useState<any>(null); // Estado para almacenar la publicación

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
      setPublicacion(response.data); // Guardar la publicación en el estado
    } catch (error: any) {
      console.error(
        "[addPublication] Error capturado en el componente:",
        error
      );

      let isErrorFromInterceptor401 = false;

      // El error que llega aquí es el 'new Error(...)' que creaste en el interceptor para el 401.
      // Este nuevo error NO es un AxiosError y no tiene 'error.response'.
      // Verificamos por el mensaje que le pusimos en el interceptor.
      if (error instanceof Error) {
        // Primero, asegurarnos que es un objeto Error
        const errorMessageString = error.message.toLowerCase(); // Convertir a minúsculas para ser flexible
        if (
          errorMessageString.includes("401") ||
          errorMessageString.includes("autenticación") ||
          errorMessageString.includes("session expired")
        ) {
          // Estas palabras clave indican que es probable que el interceptor haya manejado un 401.
          isErrorFromInterceptor401 = true;
          console.log(
            "[addPublication Component Catch] Error parece ser un 401 manejado por el interceptor (basado en mensaje). No se mostrará alert adicional."
          );
        }
      }

      if (!isErrorFromInterceptor401) {
        // Si no fue un 401 manejado por el interceptor (o no pudimos identificarlo por el mensaje),
        // entonces es otro tipo de error (ej. 404, 500, error de red que el interceptor no redirigió).
        console.log(
          "[addPublication Component Catch] Error NO es un 401 del interceptor, mostrando alert."
        );
        let displayMessage =
          "Ocurrió un error al obtener los detalles de la publicación.";

        if (axios.isAxiosError(error)) {
          // Aunque el 401 se envuelve, otros errores de Axios podrían llegar aquí directamente
          const axiosError = error as AxiosError<any>; // Cast seguro aquí porque ya verificamos
          displayMessage =
            axiosError.response?.data?.message ||
            axiosError.message ||
            `Error del servidor: ${axiosError.response?.status}`;
        } else if (error instanceof Error) {
          // Error genérico
          displayMessage = error.message;
        }
        alert(displayMessage);
        // setPublicacion(null);
        // setErrorState(displayMessage);
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
      const newTransactionId = Math.random().toString(36).substring(7);
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
