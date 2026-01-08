import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

interface WeeklyChartProps {
  data: {
    day: string;
    protein: number;
    carbs: number;
    fats: number;
    totalCalories: number;
  }[];
  isDarkMode?: boolean;
}

const WeeklyChart: React.FC<WeeklyChartProps> = ({ data, isDarkMode = false }) => {
  const tickColor = isDarkMode ? '#9ca3af' : '#9ca3af'; // Can be tweaked, gray-400 looks ok on both
  const gridColor = isDarkMode ? '#374151' : '#f3f4f6';

  return (
    <div className={`rounded-2xl p-5 shadow-sm border transition-colors duration-300 ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
      <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Progresso Semanal</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
            <XAxis 
              dataKey="day" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: tickColor, fontSize: 12 }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: tickColor, fontSize: 12 }} 
            />
            <Tooltip 
              cursor={{ fill: isDarkMode ? '#1f2937' : '#f9fafb' }}
              contentStyle={{ 
                borderRadius: '12px', 
                border: 'none', 
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                color: isDarkMode ? '#f3f4f6' : '#111827'
              }}
              labelStyle={{ color: isDarkMode ? '#e5e7eb' : '#374151' }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
            <Bar dataKey="protein" name="Proteína" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
            <Bar dataKey="carbs" name="Carbo" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
            <Bar dataKey="fats" name="Gordura" stackId="a" fill="#eab308" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default WeeklyChart;