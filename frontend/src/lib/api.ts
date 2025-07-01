// En @/lib/api.ts
import axios from "axios";

// Idealmente, la función de logout y redirección estaría en un módulo separado
// y se importaría aquí. Por ahora, la definiremos aquí para simplicidad,
// pero considera moverla a un servicio de autenticación o contexto.

const handleLogoutAndRedirect = () => {
  console.log(
    "[API Interceptor] Ejecutando logout y redirección por error 401..."
  );
  if (typeof window !== "undefined") {
    // Limpia cualquier dato de sesión del cliente
    localStorage.removeItem("userId"); // Asegúrate que esta es la clave correcta
    // localStorage.removeItem('nombreDeTuTokenSiLoGuardasAparte'); // Si guardas otros tokens
    // También podrías querer limpiar cookies no HttpOnly si las usas para algo.

    // Si tienes un estado global (Context API, Redux, Zustand, etc.) para el usuario,
    // deberías despachar una acción o llamar a una función para limpiar ese estado.
    // Ejemplo: authContext.logout(); o store.dispatch({ type: 'LOGOUT_USER' });

    // Muestra un mensaje al usuario
    alert(
      "Tu sesión ha expirado o no estás autorizado. Serás redirigido al inicio de sesión."
    );

    // Redirige a la página de login
    window.location.href = "/sign-in"; // O la ruta de tu página de login
    // Usar window.location.href es una forma simple y efectiva
    // de redirigir desde fuera de un componente React
    // y asegura una recarga completa, limpiando el estado de React.
  }
};

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL, // URL base de tu API
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // MUY IMPORTANTE: Para que las cookies (como tu accessToken)
  // se envíen automáticamente con cada solicitud al backend.
});

// Interceptor de Respuesta
api.interceptors.response.use(
  (response) => {
    // Si la respuesta es exitosa (código de estado 2xx), simplemente devuélvela
    return response;
  },
  (error) => {
    // Si hay un error en la respuesta
    if (error.response) {
      if (error.response.status === 401) {
        // Error 401: No autorizado o sesión expirada
        // Evitar múltiples redirecciones si ya se está manejando o si varias llamadas fallan a la vez
        // Una forma simple es verificar si ya estamos en la página de login.
        if (
          typeof window !== "undefined" &&
          window.location.pathname !== "/sign-in"
        ) {
          handleLogoutAndRedirect();
        }
        // Devolvemos una promesa rechazada para que la llamada original sepa que hubo un error,
        // aunque ya hayamos redirigido. Esto puede ser útil si alguna lógica
        // específica en el componente necesita reaccionar al error 401 antes de la redirección total.
        return Promise.reject(
          new Error(
            error.response.data?.message || "Error de autenticación (401)"
          )
        );
      }
      // Puedes añadir manejo para otros códigos de error comunes si quieres (ej. 403, 500)
      // else if (error.response.status === 403) {
      //   alert("No tienes permiso para realizar esta acción.");
      // }
    } else if (error.request) {
      // La solicitud se hizo pero no se recibió respuesta (ej. problema de red, servidor caído)
      console.error(
        "[API Interceptor] No se recibió respuesta del servidor:",
        error.request
      );
      alert(
        "No se pudo conectar con el servidor. Por favor, revisa tu conexión de red."
      );
    } else {
      // Algo sucedió al configurar la solicitud que provocó un error
      console.error(
        "[API Interceptor] Error al configurar la solicitud:",
        error.message
      );
      alert("Ocurrió un error al preparar la solicitud.");
    }

    // Para cualquier error que no sea un 401 manejado con redirección,
    // o para que la cadena de promesas continúe, rechaza la promesa.
    return Promise.reject(error);
  }
);

export default api;
