const calculateEndDate = (
  startDate: string | undefined, // Ej: "4/5/2025"
  days: string | undefined, // Ej: "1 DÍA" o "1 MES"
  selectedTime: string = "12:00 AM", // Ej: "3 PM"
  hours: string | undefined // Ej: "24 H"
): string => {
  console.log("calculateEndDate recibió:", {
    startDate,
    days,
    selectedTime,
    hours,
  });

  if (!startDate || !days || !hours) {
    console.error("Uno o más valores son inválidos");
    return "Fecha inválida";
  }

  // Parsear fecha en formato dd/mm/yyyy
  const [day, month, year] = startDate.split("/");
  if (!day || !month || !year) {
    throw new Error("Formato de fecha inválido. Debe ser 'dd/mm/yyyy'.");
  }

  const formattedDay = day.padStart(2, "0");
  const formattedMonth = month.padStart(2, "0");
  const formattedDate = `${year}-${formattedMonth}-${formattedDay}`;

  const baseDate = new Date(formattedDate); // 2025-05-04

  // Parsear selectedTime (ej: "3 PM")
  const timeParts = selectedTime.split(" ");
  if (timeParts.length !== 2) {
    throw new Error("Formato de hora inválido. Debe ser como '3 PM'.");
  }

  const [hourStr, period] = timeParts;
  let hour = parseInt(hourStr);

  if (isNaN(hour)) {
    throw new Error("Hora inválida en selectedTime.");
  }

  if (period.toUpperCase() === "PM" && hour !== 12) {
    hour += 12;
  } else if (period.toUpperCase() === "AM" && hour === 12) {
    hour = 0;
  }

  baseDate.setHours(hour, 0, 0, 0); // Hora exacta sin minutos ni segundos

  // Determinar cantidad de días
  let numberOfDays = 0;
  if (days.toUpperCase().includes("MES")) {
    numberOfDays = 30; // Ajusta si tus reglas lo definen distinto
  } else {
    const parsedDays = parseInt(days);
    if (isNaN(parsedDays)) {
      throw new Error("Número de días inválido.");
    }
    numberOfDays = parsedDays;
  }

  // Determinar cantidad de horas
  const numberOfHours = parseInt(hours);
  if (isNaN(numberOfHours)) {
    throw new Error("Número de horas inválido.");
  }

  // Calcular fecha de finalización
  const endDate = new Date(baseDate);
  endDate.setDate(endDate.getDate() + numberOfDays);
  endDate.setHours(endDate.getHours() + numberOfHours);

  // Debug
  console.log("Fecha final calculada:", endDate.toISOString());

  // Formato legible de salida
  const formattedEndDate = `${endDate.getDate()}/${
    endDate.getMonth() + 1
  }/${endDate.getFullYear()} ${endDate.toLocaleTimeString("es-CO", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })}`;

  return formattedEndDate;
};

export default calculateEndDate;
