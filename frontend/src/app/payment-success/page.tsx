import { Suspense } from "react";
import PaymentSuccess from "@/components/PaymentSuccess";

// Un componente de carga simple para el fallback
const LoadingSpinner = () => <div>Cargando estado del pago...</div>;

export default function PaymentSuccessPage() {
  return (
    <div>
      <h1>Estado del Pago</h1>
      {/* 👇 AQUÍ ESTÁ LA SOLUCIÓN 👇 */}
      <Suspense fallback={<LoadingSpinner />}>
        <PaymentSuccess />
      </Suspense>
    </div>
  );
}
