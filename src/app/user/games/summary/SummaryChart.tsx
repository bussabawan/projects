"use client";

import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface SummaryChartProps {
  data: { name: string; date: string; score: number }[];
}

export default function SummaryChart({ data }: SummaryChartProps) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#666' }} axisLine={{ stroke: '#ccc' }} tickLine={false} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#666' }} axisLine={{ stroke: '#ccc' }} tickLine={false} width={30} />
        <Tooltip 
          cursor={{stroke: '#ccc', strokeWidth: 1}} 
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const item = payload[0].payload;
              return (
                <div style={{ backgroundColor: '#fff', padding: '10px', border: '1px solid #ccc', borderRadius: '8px' }}>
                  <p style={{ margin: 0, fontWeight: 'bold' }}>{item.date}</p>
                  <p style={{ margin: 0, color: '#000' }}>คะแนน: {item.score}</p>
                </div>
              );
            }
            return null;
          }}
        />
        <Line type="monotone" dataKey="score" stroke="#9B59B6" strokeWidth={3} dot={{ r: 4, fill: '#9B59B6' }} activeDot={{ r: 6 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
