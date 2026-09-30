"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface SummaryChartProps {
  data: { name: string; date: string; score: number }[];
}

export default function SummaryChart({ data }: SummaryChartProps) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data} margin={{ top: 20, right: 20, left: 20, bottom: 40 }}>
        <XAxis 
          dataKey="name" 
          tick={{ fontSize: 12, fill: '#6b7280' }} 
          axisLine={false} 
          tickLine={false} 
          interval={0}
          angle={-45}
          textAnchor="end"
          height={60}
          label={{ value: 'ครั้งที่เล่น', position: 'bottom', offset: 20, fontSize: 12, fill: '#6b7280' }}
        />
        <YAxis 
          domain={[0, 100]} 
          tick={{ fontSize: 12, fill: '#6b7280' }} 
          axisLine={false} 
          tickLine={false} 
          width={40} 
          label={{ value: 'คะแนน', angle: -90, position: 'insideLeft', offset: -10, fontSize: 12, fill: '#6b7280' }}
        />
        <Tooltip 
          cursor={{stroke: '#ccc', strokeWidth: 1, strokeDasharray: '3 3'}} 
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const item = payload[0].payload;
              return (
                <div style={{ backgroundColor: '#fff', padding: '12px', border: 'none', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                  <p style={{ margin: 0, fontWeight: 'bold', color: '#111' }}>{item.date}</p>
                  <p style={{ margin: '5px 0 0 0', color: '#6b7280' }}>คะแนน: <span style={{color: '#9B59B6', fontWeight: 'bold'}}>{item.score}</span></p>
                </div>
              );
            }
            return null;
          }}
        />
        <Line type="monotone" dataKey="score" stroke="#9B59B6" strokeWidth={4} dot={{ r: 4, fill: '#9B59B6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
