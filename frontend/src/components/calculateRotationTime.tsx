const calculateRotationTime = (
  selectedTime: string,
  selectedPricing: { hours: string }
) => {
  console.log("selectedTime", selectedTime, "selectedPricing", selectedPricing);
  const startTime = selectedTime; // Hora de inicio
  const hours = parseInt(selectedPricing.hours); // Horas de rotación

  // Convertir la hora de inicio a un formato manejable (ej: "10 AM" -> 10)
  const startHour = (timeStr: string): number => {
    const [hourStr, period] = timeStr.split(" "); // Divide "10 AM" en ["10", "AM"]
    const hour = parseInt(hourStr); // Convierte "10" en 10

    if (period === "PM" && hour !== 12) return hour + 12; // Si es PM y no es 12, sumamos 12 (ej: 10 PM -> 22)
    if (period === "AM" && hour === 12) return 0;

    return hour;
  };

  // Calcular la hora de finalización (aplicando módulo 24)
  const startHourValue = startHour(startTime);
  const endHourValue = (startHourValue + hours) % 24;

  // Formatear la hora de finalización (ej: 18 -> "6 PM")
  const formatHour = (hour: number) => {
    // Determinar el periodo AM/PM correcto basado en la hora en formato 24h
    const period = hour >= 12 && hour < 24 ? "PM" : "AM";
    // Convertir a formato 12h
    const formattedHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${formattedHour} ${period}`;
  };

  const startTimeDisplay = formatHour(startHourValue);
  const endTimeDisplay = formatHour(endHourValue);

  return (
    <span>
      <span className="text-green-500 font-semibold">ROTANDO:</span> {hours}{" "}
      HORAS, desde la(s) {startTimeDisplay} hasta la(s) {endTimeDisplay}
    </span>
  );
};

export default calculateRotationTime;
