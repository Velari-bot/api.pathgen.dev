"use client";

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

const data = [
  { name: '1', requests: 1200 }, { name: '2', requests: 1800 }, { name: '3', requests: 1400 },
  { name: '4', requests: 2200 }, { name: '5', requests: 3100 }, { name: '6', requests: 2800 },
  { name: '7', requests: 3400 }, { name: '8', requests: 2500 }, { name: '9', requests: 1900 },
  { name: '10', requests: 2100 }, { name: '11', requests: 2700 }, { name: '12', requests: 3000 },
  // ... more for 30 days
];

export function UsageChart() {
  return (
    <div className="h-64 mt-4 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis 
            dataKey="name" 
            stroke="rgba(255,255,255,0.3)" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
          />
          <YAxis 
            stroke="rgba(255,255,255,0.3)" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false}
            tickFormatter={(value) => `${value}`}
          />
          <Tooltip 
            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
            contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
            itemStyle={{ color: 'var(--primary)', fontStyle: 'bold' }}
          />
          <Bar 
            dataKey="requests" 
            fill="var(--primary)" 
            radius={[4, 4, 0, 0]}
          >
             {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fillOpacity={0.4 + (index / 30) * 0.6} />
             ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
