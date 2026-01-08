import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface MacroChartProps {
  protein: number;
  carbs: number;
  fats: number;
}

const MacroChart: React.FC<MacroChartProps> = ({ protein, carbs, fats }) => {
  const data = [
    { name: 'Proteína', value: protein, color: '#3b82f6' }, // Blue
    { name: 'Carboidratos', value: carbs, color: '#22c55e' }, // Green
    { name: 'Gorduras', value: fats, color: '#eab308' },   // Yellow
  ];

  // Handle case with no data
  if (protein === 0 && carbs === 0 && fats === 0) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-gray-50 rounded-full text-gray-400 text-[10px]">
        --
      </div>
    );
  }

  return (
    <div className="h-24 w-full relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius="60%"
            outerRadius="90%"
            paddingAngle={5}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number) => [`${value}g`, '']}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', padding: '8px' }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
        {/* Empty center or could add total cal */}
      </div>
    </div>
  );
};

export default MacroChart;