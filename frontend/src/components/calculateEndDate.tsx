const calculateEndDate = (
  startDate: string | undefined, // Formato: "dd/mm/yyyy"
  days: string | undefined, // Ejemplo: "1 DÍA", "1 MES"
  selectedTime: string = "12:00 AM", // Hora de inicio (ej: "7 AM")
  hours: string | undefined // Duración en horas (ej: "6 H")
) => {
  console.log("calculateEndDate recibió:", {
    startDate,
    days,
    selectedTime,
    hours,
  });

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

  const [day, month, year] = startDate.split("/");
  if (!day || !month || !year) {
    throw new Error("Formato de fecha inválido. Debe ser 'dd/mm/yyyy'.");
  }

  const formattedMonth = month.padStart(2, "0");
  const formattedDay = day.padStart(2, "0");

  const start = new Date(`${year}-${formattedMonth}-${formattedDay}`);

  // Convertir "1 MES" a 30 días, y extraer número si es "1 DÍA", "3 DÍAS", etc.
  let numberOfDays = 0;
  if (days.toUpperCase().includes("MES")) {
    numberOfDays = 30; // Puedes ajustar según tus reglas de negocio
  } else {
    const parsedDays = parseInt(days);
    if (isNaN(parsedDays)) {
      throw new Error("Formato de días inválido. Debe ser un número.");
    }
    numberOfDays = parsedDays;
  }

  // Procesar la hora de inicio
  const timeParts = selectedTime.split(" ");
  if (timeParts.length !== 2) {
    throw new Error(
      "Formato de hora inválido. Debe ser como '7 AM' o '1:30 PM'."
    );
  }

  let [hour, minute] = timeParts[0].split(":").map(Number);
  const period = timeParts[1].toUpperCase();

  if (period === "PM" && hour !== 12) {
    hour += 12;
  } else if (period === "AM" && hour === 12) {
    hour = 0;
  }

  start.setHours(hour, minute || 0, 0, 0);

  // Extraer cantidad de horas (ej: "24 H" => 24)
  const numberOfHours = parseInt(hours);
  if (isNaN(numberOfHours)) {
    throw new Error("Formato de horas inválido. Debe ser un número.");
  }

  // Calcular fecha final correctamente
  const endDate = new Date(start);
  endDate.setDate(start.getDate() + numberOfDays); // ✅ SIN +1 innecesario
  endDate.setHours(start.getHours() + numberOfHours);

  // Formatear salida
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
