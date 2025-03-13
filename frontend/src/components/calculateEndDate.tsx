const calculateEndDate = (
  startDate: string | undefined, // Formato: "dd/mm/yyyy"
  days: string | undefined, // Ejemplo: "1 DÍA"
  selectedTime: string = "12:00 AM", // Hora de inicio (ej: "7 AM")
  hours: string | undefined // Duración en horas (ej: "6 H")
) => {
  // Registro de los valores recibidos
  console.log("calculateEndDate recibió:", {
    startDate,
    days,
    selectedTime,
    hours,
  });

  // Verificación detallada
  if (!startDate) {
    console.error("startDate es undefined o vacío");
    return "Fecha inválida";
  }
  if (!days) {
    console.error("days es undefined o vacío");
    return "Fecha inválida";
  }
  if (!hours) {
    console.error("hours es undefined o vacío");
    return "Fecha inválida";
  }

  // Convertir la fecha de inicio (startDate) a un objeto Date
  const [day, month, year] = startDate.split("/"); // Asume el formato "dd/mm/yyyy"
  if (!day || !month || !year) {
    throw new Error("Formato de fecha inválido. Debe ser 'dd/mm/yyyy'.");
  }

  // Asegurar que el mes y el día tengan dos dígitos
  const formattedMonth = month.padStart(2, "0");
  const formattedDay = day.padStart(2, "0");

  const start = new Date(`${year}-${formattedMonth}-${formattedDay}`); // Formato ISO: "yyyy-mm-dd"

  // Extraer el número de días del string (ej: "1 DÍA" -> 1)
  const numberOfDays = parseInt(days);
  if (isNaN(numberOfDays)) {
    throw new Error("Formato de días inválido. Debe ser un número.");
  }

  // Extraer la hora de inicio (selectedTime) y convertirla a formato de 24 horas
  const timeParts = selectedTime.split(" ");
  if (timeParts.length !== 2) {
    throw new Error(
      "Formato de hora inválido. Debe ser como '7 AM' o '1:30 PM'."
    );
  }

  let [hour, minute] = timeParts[0].split(":").map(Number);
  const period = timeParts[1].toUpperCase(); // "AM" o "PM"

  // Convertir la hora a formato de 24 horas
  if (period === "PM" && hour !== 12) {
    hour += 12;
  } else if (period === "AM" && hour === 12) {
    hour = 0;
  }

  // Establecer la hora de inicio en el objeto Date
  start.setHours(hour, minute || 0, 0, 0); // Si no hay minutos, usar 0

  // Extraer el número de horas del string (ej: "6 H" -> 6)
  const numberOfHours = parseInt(hours);
  if (isNaN(numberOfHours)) {
    throw new Error("Formato de horas inválido. Debe ser un número.");
  }

  // Calcular la fecha y hora de finalización
  const endDate = new Date(start);
  endDate.setDate(start.getDate() + numberOfDays); // Sumar días
  endDate.setHours(start.getHours() + numberOfHours); // Sumar horas

  // Formatear la fecha y hora de finalización como "dd/mm/yyyy hh:mm a. m./p. m."
  const formattedEndDate = `${endDate.getDate()}/${
    endDate.getMonth() + 1
  }/${endDate.getFullYear()} ${endDate.toLocaleTimeString("es-CO", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  })}`;

  return formattedEndDate;
};

export default calculateEndDate;
