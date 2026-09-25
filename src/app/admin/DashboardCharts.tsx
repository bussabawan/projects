"use client";


import { useState, useEffect } from "react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from "recharts";
import styles from "./admin.module.css";

const COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#3b82f6", "#ef4444", "#14b8a6", "#f97316", "#06b6d4"];

export default function DashboardCharts({ 
  usageStats, 
  imageCategoryStats, 
  exerciseCategoryStats 
}: { 
  usageStats: Record<string, unknown>[], 
  imageCategoryStats: Record<string, unknown>[], 
  exerciseCategoryStats: Record<string, unknown>[] 
}) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const renderCustomLabel = (props: Record<string, unknown>) => {
    const { x, y, name, percent, textAnchor, fill } = props as { x: number, y: number, name: string, percent: number, textAnchor: string, fill: string };
    const isLong = name.length > 12;
    
    let line1 = name;
    let line2 = `${((percent || 0) * 100).toFixed(0)}%`;
    
    if (isLong) {
      if (typeof Intl !== 'undefined' && Intl.Segmenter) {
        const segmenter = new Intl.Segmenter('th', { granularity: 'word' });
        const segments = Array.from(segmenter.segment(name)).map(s => s.segment);
        line1 = "";
        let currentLine2 = "";
        for (const word of segments) {
          if (!currentLine2 && line1.length + word.length <= 14) {
            line1 += word;
          } else {
            currentLine2 += word;
          }
        }
        line2 = currentLine2 ? `${currentLine2} ${line2}` : line2;
      } else {
        const mid = Math.floor(name.length / 2);
        line1 = name.substring(0, mid);
        line2 = `${name.substring(mid)} ${line2}`;
      }
    }

    return (
      <text x={x} y={y} fill={fill} textAnchor={textAnchor as "start" | "inherit" | "middle" | "end" | undefined} fontSize={12} dominantBaseline="central">
        {isLong ? (
          <>
            <tspan x={x} dy="-0.6em">{line1}</tspan>
            <tspan x={x} dy="1.2em">{line2}</tspan>
          </>
        ) : (
          <tspan x={x} dy="0">{`${name} ${line2}`}</tspan>
        )}
      </text>
    );
  };

  return (
    <div className={styles.chartsContainer}>
      <div className={styles.chartCard}>
        <h2 className={styles.chartTitle}>สถิติการเข้าใช้งานระบบ (14 วันล่าสุด)</h2>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <LineChart data={usageStats} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Line type="monotone" dataKey="เข้าใช้งาน" stroke="#4f46e5" strokeWidth={4} dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={styles.chartRow}>
        <div className={styles.chartCard}>
          <h2 className={styles.chartTitle}>สัดส่วนรูปภาพในแต่ละหมวดหมู่</h2>
          <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={imageCategoryStats}
                  cx="50%"
                  cy={isMobile ? "45%" : "50%"}
                  outerRadius={isMobile ? "80%" : "75%"}
                  innerRadius={isMobile ? "55%" : "55%"}
                  paddingAngle={5}
                  fill="#8884d8"
                  dataKey="value"
                  labelLine={!isMobile}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  label={isMobile ? false : renderCustomLabel as any}
                >
                  {imageCategoryStats.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any, name: any) => [`${value} รูป`, name]}
                />
                {isMobile && (
                  <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center" 
                    wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} 
                  />
                )}
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={styles.chartCard}>
          <h2 className={styles.chartTitle}>จำนวนชุดแบบฝึกหัดในแต่ละหมวดหมู่</h2>
          <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer>
              <BarChart data={exerciseCategoryStats} margin={{ top: 20, right: 30, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#6b7280', fontSize: 12 }} 
                  tickFormatter={(value) => value.length > 18 ? value.substring(0, 18) + '...' : value}
                  axisLine={false} 
                  tickLine={false}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis allowDecimals={false} tick={{ fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                />
                <Bar dataKey="จำนวนชุด" radius={[6, 6, 0, 0]}>
                  {exerciseCategoryStats.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 1) % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
