export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow rounded-lg my-10">
      <h1 className="text-3xl font-bold mb-4">Términos y Condiciones</h1>
      <p className="text-sm text-gray-600 mb-6">
        <strong>Última actualización:</strong> 10 de abril de 2025
      </p>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">
          1. Aceptación de los Términos
        </h2>
        <p>
          Bienvenido a <strong>[Nombre del Sitio Web]</strong>. Al acceder y
          utilizar este sitio web (en adelante, “el Sitio”), usted acepta estar
          sujeto a los presentes Términos y Condiciones. Si no está de acuerdo
          con alguna parte de estos términos, por favor absténgase de acceder,
          navegar o utilizar el Sitio.
        </p>
        <p>
          El uso del Sitio implica la aceptación plena y sin reservas de todas y
          cada una de las disposiciones incluidas en estos Términos y
          Condiciones.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">2. Restricción de Edad</h2>
        <p>
          Este sitio web está destinado{" "}
          <strong>
            única y exclusivamente a personas mayores de 18 años de edad
          </strong>
          .
        </p>
        <p>
          Al ingresar al Sitio, usted declara bajo la gravedad del juramento
          que:
        </p>
        <ul className="list-disc list-inside">
          <li>
            Tiene <strong>18 años o más</strong>.
          </li>
          <li>
            Posee plena capacidad legal para aceptar estos Términos y
            Condiciones.
          </li>
          <li>
            Comprende que el contenido y/o los servicios ofrecidos pueden estar
            dirigidos a un público adulto.
          </li>
        </ul>
        <p className="mt-2">
          <strong>
            Queda terminantemente prohibido el acceso, uso o navegación del
            Sitio por parte de menores de edad.
          </strong>
        </p>
        <p>
          Cualquier intento de ingreso por parte de personas menores de 18 años
          podrá constituir una infracción legal en los términos del{" "}
          <strong>Código Penal Colombiano</strong>, y no será permitido bajo
          ninguna circunstancia.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">3. Uso del Sitio</h2>
        <p>
          Usted se compromete a hacer un uso responsable, legal y respetuoso del
          Sitio y de todos los servicios y contenidos disponibles en él. Está
          estrictamente prohibido:
        </p>
        <ul className="list-disc list-inside">
          <li>Utilizar el Sitio con fines ilegales o no autorizados.</li>
          <li>
            Publicar, compartir o distribuir contenido que infrinja derechos de
            terceros o la ley.
          </li>
          <li>Compartir el acceso con menores de edad.</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">4. Propiedad Intelectual</h2>
        <p>
          Todos los contenidos del Sitio son propiedad de{" "}
          <strong>[Nombre de la Empresa]</strong> o se usan bajo licencia y
          están protegidos por las leyes de propiedad intelectual de Colombia.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">
          5. Modificaciones de los Términos
        </h2>
        <p>
          Nos reservamos el derecho de modificar estos Términos y Condiciones en
          cualquier momento y sin previo aviso. Las modificaciones se
          considerarán aceptadas si el usuario continúa utilizando el Sitio tras
          su publicación.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">6. Responsabilidad</h2>
        <p>
          El Sitio no será responsable por el uso inadecuado o no autorizado por
          parte de los usuarios ni por el acceso no consentido por parte de
          menores de edad que utilicen datos falsos.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">
          7. Legislación Aplicable y Jurisdicción
        </h2>
        <p>
          Estos Términos y Condiciones se rigen por las leyes de la República de
          Colombia. Cualquier disputa será resuelta ante los tribunales
          competentes de <strong>[Ciudad]</strong>.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">8. Contacto</h2>
        <p>
          Para cualquier duda o consulta sobre estos Términos, puede escribirnos
          a:
        </p>
        <ul className="list-none mt-2">
          <li>
            <strong>Correo:</strong> contacto@[tusitio].com
          </li>
          <li>
            <strong>Teléfono:</strong> +57 3XX XXX XXXX
          </li>
        </ul>
      </section>
    </div>
  );
}
