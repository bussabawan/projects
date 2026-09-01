"use client";

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface SummaryChartProps {
  data: { name: string; date: string; score: number }[];
}

export default function SummaryChart({ data }: SummaryChartProps) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data}>
        <XAxis dataKey="name" hide />
        <YAxis hide domain={[0, 100]} />
        <Tooltip 
          cursor={{fill: 'transparent'}} 
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
        <Bar dataKey="score" fill="#9B59B6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
