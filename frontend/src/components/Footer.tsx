import React from "react";

export const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-6 px-4 text-sm">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between gap-4">
        <div>
          <p>&copy; 2025 DEVIA. Todos los derechos reservados.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-2 md:gap-4">
          <a href="/TermsyCond" className="hover:underline">
            Términos y condiciones
          </a>
          <a href="/privacyPolicy" className="hover:underline">
            Política de privacidad
          </a>
        </div>
      </div>
    </footer>
  );
};
