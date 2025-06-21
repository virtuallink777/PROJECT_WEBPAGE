"use client";

interface Props {
  selectedPricing: {
    hours: string;
    days: string;
    price: number;
  } | null;
  selectedTime: string;
  handlePayment: (method: string) => void;
}

const PSEPaymentButton = ({
  selectedPricing,
  selectedTime,
  handlePayment,
}: Props) => {
  const handlePSEPayment = async () => {
    if (!selectedPricing || !selectedTime) {
      alert("Por favor selecciona todos los campos antes de pagar.");
      return;
    }

    handlePayment("pse"); // Llama a la función handlePayment con el método "pse"

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/pse/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: selectedPricing.price, // usa el monto real seleccionado
            description: `Pago de publicación (${selectedPricing.days} días - ${selectedPricing.hours} horas)`,
            method: "bank_account", // obligatorio para PSE
            customer: {
              name: "Juan",
              last_name: "Pérez",
              email: "juan.perez@example.com",
              phone_number: "3001234567",
            },
            requires_account: true,
          }),
        }
      );

      const data = await response.json();

      console.log("Respuesta de Openpay:", data);

      if (data.payment_method && data.payment_method.url) {
        window.location.href = data.payment_method.url;
      } else {
        throw new Error("No se pudo obtener la URL de pago.");
      }
    } catch (error) {
      console.error("Error en el pago PSE:", error);
      alert(
        "Error en el pago. No pudimos verificar tu pago. Intenta nuevamente."
      );
    }
  };

  return (
    <button
      onClick={handlePSEPayment}
      className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg"
    >
      Pagar con PSE
    </button>
  );
};

export default PSEPaymentButton;
