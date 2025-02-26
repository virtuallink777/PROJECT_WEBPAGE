import React from "react";

interface PricingTableProps {
  onSelect: (selection: { hours: string; days: string; price: number }) => void;
}

const PricingTable: React.FC<PricingTableProps> = ({ onSelect }) => {
  const headers = ["1 DÍA", "3 DÍAS", "7 DÍAS", "15 DÍAS", "1 MES"];
  const data = [
    { hours: "6 H", prices: [10000, 16000, 30000, 45000, 85000] },
    { hours: "10 H", prices: [14000, 28000, 50000, 75000, 145000] },
    { hours: "14 H", prices: [18000, 40000, 70000, 105000, 200000] },
    { hours: "24 H", prices: [38000, 70000, 90000, 170000, 250000] },
  ];

  return (
    <>
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
                  {row.prices.map((price, colIndex) => (
                    <td
                      key={colIndex}
                      className="p-3 border border-gray-300 text-green-600 font-bold cursor-pointer hover:bg-gray-200"
                      onClick={() =>
                        onSelect({
                          hours: row.hours,
                          days: headers[colIndex],
                          price,
                        })
                      }
                    >
                      ${price.toLocaleString()}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default PricingTable;
