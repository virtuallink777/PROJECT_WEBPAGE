export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow rounded-lg my-10">
      <h1 className="text-3xl font-bold mb-4">Política de Privacidad</h1>
      <p className="text-sm text-gray-600 mb-6">
        <strong>Última actualización:</strong> 10 de abril de 2025
      </p>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">1. Introducción</h2>
        <p>
          En <strong>[Nombre del Sitio Web]</strong> nos comprometemos a
          proteger la privacidad de nuestros usuarios. Esta Política de
          Privacidad describe cómo recopilamos, usamos, almacenamos y protegemos
          la información personal que nos proporciona.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">
          2. Recolección de Datos Personales
        </h2>
        <p>
          Al utilizar nuestro sitio, podemos solicitarle cierta información
          personal, incluyendo pero no limitada a:
        </p>
        <ul className="list-disc list-inside">
          <li>Nombre completo</li>
          <li>Dirección de correo electrónico</li>
          <li>Fecha de nacimiento</li>
          <li>Datos de navegación (cookies, IP, dispositivo)</li>
        </ul>
        <p className="mt-2">
          Toda la información recolectada será tratada conforme a lo establecido
          en la Ley 1581 de 2012 y el Decreto 1377 de 2013.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">
          3. Finalidad del Tratamiento de Datos
        </h2>
        <p>
          Utilizamos su información personal con las siguientes finalidades:
        </p>
        <ul className="list-disc list-inside">
          <li>Verificar la mayoría de edad del usuario</li>
          <li>
            Proporcionar acceso a contenido exclusivo para mayores de 18 años
          </li>
          <li>Mejorar nuestros servicios y personalizar la experiencia</li>
          <li>
            Enviar comunicaciones informativas y promocionales (previa
            autorización)
          </li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">
          4. Consentimiento y Veracidad de la Información
        </h2>
        <p>
          Al registrarse o navegar en nuestro sitio, usted autoriza expresamente
          el tratamiento de sus datos personales. Además, declara que es{" "}
          <strong>mayor de 18 años</strong> y que la información proporcionada
          es veraz, completa y actual.
        </p>
        <p className="mt-2">
          <strong>
            No está permitido el uso del sitio por parte de menores de edad.
          </strong>{" "}
          Si detectamos que un menor ha accedido al sitio utilizando datos
          falsos, eliminaremos inmediatamente su información y, si es necesario,
          notificaremos a las autoridades competentes.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">5. Derechos del Titular</h2>
        <p>De acuerdo con la legislación colombiana, usted tiene derecho a:</p>
        <ul className="list-disc list-inside">
          <li>Conocer, actualizar y rectificar sus datos personales</li>
          <li>Solicitar prueba de la autorización otorgada</li>
          <li>
            Revocar la autorización o solicitar la eliminación de los datos
          </li>
          <li>
            Presentar quejas ante la Superintendencia de Industria y Comercio
          </li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">
          6. Seguridad de la Información
        </h2>
        <p>
          Implementamos medidas de seguridad técnicas, legales y administrativas
          para proteger su información. Sin embargo, ningún sistema es
          completamente infalible, por lo que no podemos garantizar seguridad
          absoluta.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">7. Uso de Cookies</h2>
        <p>
          Este sitio utiliza cookies para mejorar la experiencia del usuario. Al
          continuar navegando, usted acepta su uso. Puede desactivarlas en la
          configuración de su navegador.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">
          8. Transferencia de Información
        </h2>
        <p>
          No compartiremos sus datos personales con terceros sin su
          consentimiento, salvo cuando sea requerido por autoridades judiciales
          o administrativas en ejercicio de sus funciones legales.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">9. Modificaciones</h2>
        <p>
          Esta política puede ser modificada en cualquier momento. Le
          notificaremos cualquier cambio sustancial a través del sitio o por
          correo electrónico.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">10. Contacto</h2>
        <p>
          Si tiene preguntas o desea ejercer sus derechos, puede contactarnos:
        </p>
        <ul className="list-none mt-2">
          <li>
            <strong>Email:</strong> privacidad@[tusitio].com
          </li>
          <li>
            <strong>Teléfono:</strong> +57 3XX XXX XXXX
          </li>
          <li>
            <strong>Responsable:</strong> [Nombre de la empresa o razón social]
          </li>
        </ul>
      </section>
    </div>
  );
}
