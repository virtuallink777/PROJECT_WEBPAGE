import React from "react";

interface TimePickerProps {
  selectedTime: string;
  onTimeChange: (time: string) => void;
}

const TimePicker: React.FC<TimePickerProps> = ({
  selectedTime,
  onTimeChange,
}) => {
  const hours = Array.from({ length: 24 }, (_, i) => {
    const hour = i % 12 === 0 ? 12 : i % 12; // Convierte 0 en 12, 13 en 1, etc.
    const period = i < 12 ? "AM" : "PM"; // AM para 0-11, PM para 12-23
    return `${hour} ${period}`;
  });

  return (
    <div className="p-4 border rounded-lg bg-gray-100">
      <label className="block font-semibold text-gray-700 mb-2">
        Selecciona la hora de inicio:
      </label>
      <select
        value={selectedTime}
        onChange={(e) => onTimeChange(e.target.value)}
        className="w-full p-2 border rounded-md bg-white shadow-sm"
      >
        {hours.map((hour) => (
          <option key={hour} value={hour}>
            {hour}
          </option>
        ))}
      </select>
    </div>
  );
};

export default TimePicker;
