"use client";

import PSEPaymentButton from "@/components/PSEPaymentButton";
import PricingTable from "@/components/TableValuesPublication";
import TimePicker from "@/components/TimePicker";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const PayPublication = () => {
  // state for select cell
  const [selectedPricing, setSelectedPricing] = useState<{
    hours: string;
    days: string;
    price: number;
  } | null>(null);
  // state for select time
  const [selectedTime, setSelectedTime] = useState(""); // Estado para la hora seleccionada

  const [transactionId, setTransactionId] = useState("");
  const [status, setStatus] = useState(false); // Estado del método de pago seleccionado
  const [DataTransaction, setDataTransaction] = useState({
    transactionDate: "",
    transactionTime: "",
  });
  const [Publicacion, setPublicacion] = useState<any>(null); // Estado para almacenar la publicación

  const _idParams = useParams();
  const id = _idParams._id as string; // Obtener el ID de la URL

  const router = useRouter();

  // traemos la publicacion por id

  const addPublication = async () => {
    try {
      const response = await fetch(
        `http://localhost:4004/api/editPublications/${id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) {
        throw new Error("Error al obtener la publicación");
      } else {
        const data = await response.json();
        console.log(data);
        setPublicacion(data); // Guardar la publicación en el estado
        console.log("Publicación obtenida:", data);
      }
    } catch (error) {
      console.error("Error al obtener la publicación:", error);
    }
  };

  // Llamar a la función para obtener la publicación al cargar el componente

  useEffect(() => {
    addPublication();
  }, []); // Llamar a la función al cargar el componente

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
