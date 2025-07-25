"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";

const PaymentSuccess = () => {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const transactionId = searchParams.get("id");

    if (transactionId) {
      // Pedimos al backend validar el pago
      axios
        .get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/pse/status/${transactionId}`
        )
        .then((res) => {
          const transaction = res.data;
          if (
            transaction.status === "completed" ||
            transaction.status === "in_progress"
          ) {
            setStatus("success");
          } else {
            setStatus("error");
          }

          setTransactionId(transactionId);
        })
        .catch((err) => {
          console.error("Error al validar el pago:", err);
          setStatus("error");
        });
    } else {
      setStatus("error");
    }
  }, [searchParams]);

  console.log("ID de transacción guardado en estado:", transactionId);

  useEffect(() => {
    const transactionId = searchParams.get("id"); // ID que te da OpenPay

    const pendingData = sessionStorage.getItem("pendingPaymentData");
    const publicationId = sessionStorage.getItem("publicationId"); // ID de la publicación

    if (transactionId && pendingData) {
      const paymentData = JSON.parse(pendingData);
      paymentData.transactionId = transactionId;

      fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/updatePublicationPayment/${publicationId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(paymentData),
        }
      )
        .then((res) => res.json())
        .then((data) => {
          console.log("Actualización exitosa:", data);
          // limpiar y redirigir
          sessionStorage.removeItem("pendingPaymentData");
          sessionStorage.removeItem("publicationId");
          router.push("/dashboard/viewPublications");
        })
        .catch((error) => {
          console.error("Error actualizando MongoDB:", error);
        });
    }
    // eslint-disable-next-line
  }, []);

  if (status === "loading") {
    return <div>Cargando...</div>;
  }

  if (status === "error") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-red-50">
        <h1 className="text-4xl font-bold text-red-700 mb-4">
          Error en el pago
        </h1>
        <p className="text-lg text-red-600 mb-6">
          No pudimos verificar tu pago. Intenta nuevamente.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-green-50">
      <h1 className="text-4xl font-bold text-green-700 mb-4">¡Pago Exitoso!</h1>
      <p className="text-lg text-green-600 mb-6">
        Tu pago ha sido procesado correctamente.
      </p>
    </div>
  );
};

export default PaymentSuccess;
