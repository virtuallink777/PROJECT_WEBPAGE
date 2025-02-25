"use client";

import PaymentMethodSelector from "@/components/PaymentMethodSelector";
import PricingTable from "@/components/TableValuesPublication";
import TimePicker from "@/components/TimePicker";
import { useState } from "react";

const PayPublication = () => {
  // state for select cell
  const [selectedCell, setSelectedCell] = useState<{
    row: number;
    col: number;
  } | null>(null);
  // state for select time
  const [selectedTime, setSelectedTime] = useState(""); // Estado para la hora seleccionada
  const [selectedPayment, setSelectedPayment] = useState(""); // Estado del método de pago seleccionado

  return (
    <>
      <div>
        <PricingTable
          selectedCell={selectedCell}
          setSelectedCell={setSelectedCell}
        />
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
        <div className="mt-8">
          <PaymentMethodSelector
            selectedPayment={selectedPayment}
            setSelectedPayment={setSelectedPayment}
          />
        </div>
      </div>
    </>
  );
};

export default PayPublication;
