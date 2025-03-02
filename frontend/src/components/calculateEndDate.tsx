const calculateEndDate = (startDate: string, days: string) => {
  // Convertir la fecha de inicio (startDate) a un objeto Date
  const [day, month, year] = startDate.split("/"); // Asume el formato "28/2/2025"
  const start = new Date(`${year}-${month}-${day}`); // Formato ISO: "2025-2-28"

  // Extraer el número de días del string (ej: "7 DÍAS" -> 7)
  const numberOfDays = parseInt(days);

  // Calcular la fecha de finalización
  const endDate = new Date(start);
  endDate.setDate(start.getDate() + numberOfDays);

  // Formatear la fecha de finalización como "dd/mm/yyyy"
  const formattedEndDate = `${endDate.getDate()}/${
    endDate.getMonth() + 1
  }/${endDate.getFullYear()}`;

  return formattedEndDate;
};

export default calculateEndDate;
