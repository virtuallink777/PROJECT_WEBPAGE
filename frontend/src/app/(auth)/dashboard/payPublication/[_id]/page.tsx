"use client";

import PricingTable from "@/components/TableValuesPublication";
import TimePicker from "@/components/TimePicker";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

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

  const _id = useParams();
  console.log("id", _id);

  const id = _id._id;

  const router = useRouter();

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
        transactionId: newTransactionId,
        transactionDate,
        transactionTime,
      };

      console.log("Datos de pago:", paymentData);

      // Enviar datos al servidor
      const response = await fetch(
        `http://localhost:4004/api/updatePublicationPayment/${id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(paymentData),
        }
      );

      if (!response.ok) {
        throw new Error("Error al procesar el pago");
      }

      const data = await response.json();
      console.log("Respuesta del servidor:", data);

      // Una vez confirmado el éxito, actualizar estados locales
      setTransactionId(newTransactionId);
      setStatus(true);
      setDataTransaction({
        transactionDate,
        transactionTime,
      });

      alert(`Pago exitoso. ID de transacción: ${newTransactionId}`);
      router.push("/dashboard/viewPublications");
    } catch (error) {
      console.error("Error al realizar el pago:", error);
      alert("Ha ocurrido un error al procesar el pago.");
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
          <h3>PAGA CON MERCADO PAGO</h3>

          <a
            href="https://link.mercadopago.com.co/deviapay"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              src="/MP_RGB_HANDSHAKE_color-azul_hori-izq.svg"
              alt="Botón de pago Mercado Pago"
              width={200}
              height={60} // puedes ajustar el alto también si quieres
            />
          </a>
        </div>
      </div>
      <div></div>
    </>
  );
};

export default PayPublication;
