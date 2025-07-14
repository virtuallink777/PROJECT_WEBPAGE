import { Suspense } from "react";
import VerifyEmailPageTsx from "@/components/VerifiEmail"; // Importa el componente que acabas de crear

const LoadingSpinner = () => <div>Cargando verificación de correo...</div>;

export default function VerifyEmailPage() {
  return (
    <div>
      <h1>Verificación de Correo</h1>
      {/* 👇 AQUÍ ESTÁ LA SOLUCIÓN 👇 */}
      <Suspense fallback={<LoadingSpinner />}>
        <VerifyEmailPageTsx />
      </Suspense>
    </div>
  );
}
