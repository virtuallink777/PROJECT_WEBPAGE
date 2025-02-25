import React from "react";

interface PricingTableProps {
  selectedCell: { row: number; col: number } | null;
  setSelectedCell: React.Dispatch<
    React.SetStateAction<{ row: number; col: number } | null>
  >;
}

const PricingTable: React.FC<PricingTableProps> = ({
  selectedCell,
  setSelectedCell,
}) => {
  const headers = ["1 DÍA", "3 DÍAS", "7 DÍAS", "15 DÍAS", "1 MES"];
  const data = [
    { hours: "6 H", prices: [10000, 16000, 30000, 45000, 85000] },
    { hours: "10 H", prices: [14000, 28000, 50000, 75000, 145000] },
    { hours: "14 H", prices: [18000, 40000, 70000, 105000, 200000] },
    { hours: "24 H", prices: [38000, 70000, 90000, 170000, 250000] },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-center mb-4">
        Tarifas de Publicidad
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 shadow-lg">
          <thead>
            <tr className="bg-rose-300 text-black">
              <th className="p-3 border border-gray-600">Horas en TOP</th>
              {headers.map((header) => (
                <th key={header} className="p-3 border border-gray-600">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="text-center bg-white hover:bg-gray-100"
              >
                <td className="p-3 border border-gray-300 font-semibold">
                  {row.hours}
                </td>
                {row.prices.map((price, colIndex) => {
                  const isSelected =
                    selectedCell?.row === rowIndex &&
                    selectedCell?.col === colIndex;

                  return (
                    <td
                      key={colIndex}
                      className={`p-3 border border-gray-300 text-green-600 font-bold cursor-pointer transition-colors
                        ${
                          isSelected
                            ? "bg-yellow-300 border-yellow-500"
                            : "hover:bg-gray-200 border-transparent"
                        }`}
                      onClick={() =>
                        setSelectedCell({ row: rowIndex, col: colIndex })
                      }
                    >
                      ${price.toLocaleString()}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Mostramos el valor seleccionado debajo de la tabla */}
      {selectedCell && (
        <div className="mt-4 p-4 bg-blue-100 text-blue-800 text-center rounded-lg">
          <strong>Seleccionaste:</strong> {data[selectedCell.row].hours} -{" "}
          {headers[selectedCell.col]}
          <br /> Precio:{" "}
          <span className="font-bold text-green-600">
            ${data[selectedCell.row].prices[selectedCell.col].toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );
};

export default PricingTable;
