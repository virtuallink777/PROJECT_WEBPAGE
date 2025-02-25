import { useState } from "react";

interface PaymentMethodSelectorProps {
  selectedPayment: string;
  setSelectedPayment: (method: string) => void;
}

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  selectedPayment,
  setSelectedPayment,
}) => {
  const paymentMethods = ["Efectivo", "PSE", "Tarjeta Crédito/Débito"];

  return (
    <div className="p-6 bg-white shadow-md rounded-lg text-center">
      <h2 className="text-xl font-bold mb-4">Selecciona tu método de pago</h2>
      <div className="flex flex-col space-y-3">
        {paymentMethods.map((method) => (
          <button
            key={method}
            onClick={() => setSelectedPayment(method)}
            className={`py-2 px-4 border rounded-lg transition-all font-semibold 
              ${
                selectedPayment === method
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 hover:bg-gray-300"
              }
            `}
          >
            {method}
          </button>
        ))}
      </div>
      {selectedPayment && (
        <p className="mt-4 text-lg text-gray-700">
          Método seleccionado:{" "}
          <span className="font-semibold">{selectedPayment}</span>
        </p>
      )}
    </div>
  );
};

export default PaymentMethodSelector;
