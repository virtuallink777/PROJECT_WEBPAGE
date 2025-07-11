import { Suspense } from "react";
import ResetPasswordForm from "@/components/ResetPasswordForm"; // Importa el componente que acabas de crear

// Un componente de carga simple para el fallback
const LoadingSpinner = () => <div>Cargando formulario...</div>;

// Esta es ahora tu página. Es un Componente de Servidor.
export default function ResetPasswordPage() {
  return (
    <div>
      <h1>Restablecer Contraseña</h1>
      {/* 👇 AQUÍ ESTÁ LA SOLUCIÓN 👇 */}
      <Suspense fallback={<LoadingSpinner />}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
