const calculateRotationTime = (
  selectedTime: string,
  selectedPricing: { hours: string }
) => {
  const startTime = selectedTime; // Hora de inicio (ej: "10 AM")
  const hours = parseInt(selectedPricing.hours); // Horas de rotación (ej: 10)

  // Convertir la hora de inicio a un formato manejable (ej: "10 AM" -> 10)
  const startHour = parseInt(startTime.split(" ")[0]);

  // Calcular la hora de finalización
  const endHour = startHour + hours;

  // Formatear la hora de finalización (ej: 18 -> "6 PM")
  const endTime = endHour > 12 ? `${endHour - 12} PM` : `${endHour} AM`;

  return (
    <span>
      <span className="text-green-500 font-semibold">ROTANDO:</span> {hours}{" "}
      HORAS, desde las {startTime} hasta {endTime}
    </span>
  );
};

export default calculateRotationTime;
