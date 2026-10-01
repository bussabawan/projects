import React, { useEffect, useState } from 'react';
import Loader from "@/app/components/Loader/Loader";
import DatePicker from "@/app/components/DatePicker/DatePicker";
import styles from './PatientStatsPopup.module.css';
import { useScrollLock } from '@/app/hooks/useScrollLock';

import { motion, AnimatePresence } from 'framer-motion';
import { 
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, Legend
} from 'recharts';

interface PatientStatsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  patientId?: string; // Optional, might be used to fetch specific stats later
  exerciseSets?: string[];
}

interface PatientStatsData {
  availableExerciseSets?: string[];
  availableCategories?: string[];
  exerciseCategoryMap?: Record<string, string[]>;
  scoreStats?: {
    total: { correct: number; incorrect: number };
    separated: {
      matching: { correct: number; incorrect: number };
      memory: { correct: number; incorrect: number };
    };
  };
  dailyStats?: {
    dateStr: string;
    logins: number;
    memoryPlays: number;
    matchingPlays: number;
    matchingCorrect: number;
    matchingIncorrect: number;
    memoryCorrect: number;
    memoryIncorrect: number;
    correct: number;
    incorrect: number;
    avgSeconds: number;
    matchingAvgSeconds: number;
    memoryAvgSeconds: number;
    totalMinutes: number;
    plays: number;
  }[];
  scatterStats?: {
    dateStr: string;
    timeOfDay: number;
    timeStr: string;
    duration: number;
    mode: string;
  }[];
}



function ScrollLockEffect() {
  useScrollLock(true);
  return null;
}

const PatientStatsPopup: React.FC<PatientStatsPopupProps> = ({ isOpen, onClose, patientId, exerciseSets = [] }) => {
  // Scroll lock moved to ScrollLockEffect inside AnimatePresence
  const [data, setData] = useState<PatientStatsData | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [loading, setLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [exerciseSetFilter, setExerciseSetFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isStartPickerOpen, setIsStartPickerOpen] = useState(false);
  const [isEndPickerOpen, setIsEndPickerOpen] = useState(false);

  const formatThaiDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const baseExerciseSets = (data?.availableExerciseSets || exerciseSets) as string[];
  const dynamicCategories = (data?.availableCategories || []) as string[];
  const exerciseCategoryMap = (data?.exerciseCategoryMap || {}) as Record<string, string[]>;
  
  const dynamicExerciseSets = categoryFilter !== 'all' 
    ? baseExerciseSets.filter(set => exerciseCategoryMap[set]?.includes(categoryFilter))
    : baseExerciseSets;

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOpen && patientId) {
      timer = setTimeout(() => {
        setLoading(true);
      }, 0);
      let url = `/api/patient-stats/${patientId}?category=${encodeURIComponent(categoryFilter)}&period=${periodFilter}&exerciseSet=${encodeURIComponent(exerciseSetFilter)}`;
      if (periodFilter === 'custom') {
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }
      const timestamp = Date.now();
      fetch(`${url}&t=${timestamp}`, { cache: 'no-store' })
        .then(res => res.json())
        .then(resData => {
          setData(resData);
          setLoading(false);
        })
        .catch(err => {
          console.error("Error fetching patient stats:", err);
          setLoading(false);
        });
    }
    return () => clearTimeout(timer);
  }, [isOpen, patientId, categoryFilter, periodFilter, exerciseSetFilter, startDate, endDate]);

  // Removed early return for AnimatePresence

  const PIE_COLORS = ['#10B981', '#EF4444']; // Green (Correct), Red (Incorrect)
  const pieTotalData = data ? [
    { name: 'ถูก', value: data.scoreStats?.total?.correct || 0 },
    { name: 'ผิด', value: data.scoreStats?.total?.incorrect || 0 },
  ] : [];

  const pieSepData = data ? [
    { name: 'จับคู่-ถูก', value: data.scoreStats?.separated?.matching?.correct || 0 },
    { name: 'จับคู่-ผิด', value: data.scoreStats?.separated?.matching?.incorrect || 0 },
    { name: 'ความจำ-ถูก', value: data.scoreStats?.separated?.memory?.correct || 0 },
    { name: 'ความจำ-ผิด', value: data.scoreStats?.separated?.memory?.incorrect || 0 },
  ] : [];
  const SEP_COLORS = ['#3B82F6', '#93C5FD', '#8B5CF6', '#C4B5FD'];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className={styles.overlay} 
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <ScrollLockEffect />
        <motion.div 
          className={styles.popup} 
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
        <div className={styles.header}>
          <h2 className={styles.title}>รายละเอียดสถิติ</h2>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close popup">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div className={styles.content}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px', flexWrap: 'wrap-reverse', gap: '15px' }}>
            <div style={{ marginTop: '5px' }}>
              {!loading && data && data.dailyStats && (
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <div style={{ background: '#f3f4f6', padding: '6px 15px', borderRadius: '20px', fontSize: '0.9rem', color: '#374151' }}>
                    จำนวน Login: <b>{data.dailyStats.reduce((acc, cur) => acc + (cur.logins || 0), 0)}</b> ครั้ง
                  </div>
                  <div style={{ background: '#ede9fe', padding: '6px 15px', borderRadius: '20px', fontSize: '0.9rem', color: '#5b21b6' }}>
                    ความจำ: <b>{data.dailyStats.reduce((acc, cur) => acc + (cur.memoryPlays || 0), 0)}</b> ครั้ง
                  </div>
                  <div style={{ background: '#dbeafe', padding: '6px 15px', borderRadius: '20px', fontSize: '0.9rem', color: '#1e40af' }}>
                    จับคู่: <b>{data.dailyStats.reduce((acc, cur) => acc + (cur.matchingPlays || 0), 0)}</b> ครั้ง
                  </div>
                </div>
              )}
            </div>
            <div className={styles.filtersWrapper} style={{ marginBottom: 0, marginLeft: 'auto' }}>
              <div className={styles.filters}>
                <select 
                className={styles.filterSelect}
                value={periodFilter}
                onChange={(e) => {
                  setPeriodFilter(e.target.value);
                  setCategoryFilter('all');
                  setExerciseSetFilter('all');
                }}
              >
                <option value="all">ทุกช่วงเวลา</option>
                <option value="today">วันนี้</option>
                <option value="last7">7 วันล่าสุด</option>
                <option value="last30">30 วันล่าสุด</option>
                <option value="thisYear">ปีนี้</option>
                <option value="custom">กำหนดเอง</option>
              </select>
              <select 
                className={styles.filterSelect}
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setExerciseSetFilter('all');
                }}
              >
                <option value="all">ทุกหมวดหมู่</option>
                {dynamicCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <select 
                className={styles.filterSelect}
                value={exerciseSetFilter}
                onChange={(e) => setExerciseSetFilter(e.target.value)}
              >
                <option value="all">ทุกชุดแบบฝึกหัด</option>
                {dynamicExerciseSets.map(set => (
                  <option key={set} value={set}>{set}</option>
                ))}
              </select>
            </div>
            
            {periodFilter === 'custom' && (
              <div className={styles.customDateWrapper}>
                <div style={{ position: 'relative' }}>
                  <button 
                    className={styles.datePickerBtn} 
                    onClick={() => setIsStartPickerOpen(true)}
                  >
                    {startDate ? formatThaiDate(startDate) : "เลือกวันที่"}
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '4px' }}>
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </button>
                  <DatePicker 
                    isOpen={isStartPickerOpen} 
                    onClose={() => setIsStartPickerOpen(false)} 
                    onSelect={(date) => { setStartDate(date); }} 
                    initialDate={startDate} 
                    title="เลือกวันที่เริ่มต้น" 
                  />
                </div>
                <span>ถึง</span>
                <div style={{ position: 'relative' }}>
                  <button 
                    className={styles.datePickerBtn} 
                    onClick={() => setIsEndPickerOpen(true)}
                  >
                    {endDate ? formatThaiDate(endDate) : "เลือกวันที่"}
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '4px' }}>
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </button>
                  <DatePicker 
                    isOpen={isEndPickerOpen} 
                    onClose={() => setIsEndPickerOpen(false)} 
                    onSelect={(date) => { setEndDate(date); }} 
                    initialDate={endDate} 
                    title="เลือกวันที่สิ้นสุด" 
                  />
                </div>
              </div>
            )}
          </div>
          </div>

          <div className={styles.statsSection}>
            <h3 className={styles.sectionTitle}>สถิติคะแนน</h3>
            
            {loading ? (
              <Loader text="กำลังโหลดสถิติคะแนน..." />
            ) : data && data.dailyStats ? (
              <div className={styles.statsGrid}>
                <div className={styles.statItem}>
                  <div className={styles.statIcon}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieTotalData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" stroke="#fff" label={({ value }) => value > 0 ? value : ''}>
                          {pieTotalData.map((_, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                        </Pie>
                        <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                        <Legend verticalAlign="bottom" height={36} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <span className={styles.statLabel}>รวม</span>
                </div>
                
                <div className={styles.statItem}>
                  <div className={styles.statIcon}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieSepData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" stroke="#fff" label={({ value }) => value > 0 ? value : ''}>
                          {pieSepData.map((_, index) => <Cell key={`cell-${index}`} fill={SEP_COLORS[index % SEP_COLORS.length]} />)}
                        </Pie>
                        <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                        <Legend verticalAlign="bottom" height={36} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <span className={styles.statLabel}>แยก</span>
                </div>

                <div className={styles.statItem}>
                  <div className={styles.statIcon}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.dailyStats} margin={{ top: 20, right: 20, bottom: 70, left: 20 }} maxBarSize={40}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis 
                          dataKey="dateStr" 
                          tick={{ fill: '#6b7280', fontSize: 12 }} 
                          axisLine={false} 
                          tickLine={false} 
                          angle={-45}
                          textAnchor="end"
                          height={60}
                          label={isMobile ? undefined : { value: 'วันที่', position: 'bottom', offset: 20, fontSize: 12, fill: '#6b7280' }}
                        />
                        <YAxis 
                          tick={{ fill: '#6b7280', fontSize: 12 }} 
                          axisLine={false} 
                          tickLine={false} 
                          label={isMobile ? undefined : { value: 'จำนวน (ครั้ง)', angle: -90, position: 'insideLeft', offset: 15, fontSize: 12, fill: '#6b7280' }}
                        />
                        <RechartsTooltip 
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              const pData = payload[0].payload;
                              return (
                                <div style={{ backgroundColor: 'white', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
                                  <p style={{margin: 0, fontWeight: 'bold'}}>{label}</p>
                                  <div style={{ marginTop: '5px' }}>
                                    <p style={{margin: 0, color: '#3B82F6', fontSize: '0.9em'}}>จับคู่-ถูก: {pData.matchingCorrect}</p>
                                    <p style={{margin: 0, color: '#93C5FD', fontSize: '0.9em'}}>จับคู่-ผิด: {pData.matchingIncorrect}</p>
                                  </div>
                                  <div style={{ marginTop: '5px' }}>
                                    <p style={{margin: 0, color: '#8B5CF6', fontSize: '0.9em'}}>ความจำ-ถูก: {pData.memoryCorrect}</p>
                                    <p style={{margin: 0, color: '#C4B5FD', fontSize: '0.9em'}}>ความจำ-ผิด: {pData.memoryIncorrect}</p>
                                  </div>
                                  <p style={{margin: 0, marginTop: '8px', fontWeight: 'bold', fontSize: '0.9em', color: '#333'}}>
                                    รวม: ถูก {pData.correct} / ผิด {pData.incorrect}
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px', paddingTop: '30px' }} />
                        <Bar dataKey="matchingCorrect" stackId="matching" fill="#3B82F6" name="จับคู่-ถูก" />
                        <Bar dataKey="matchingIncorrect" stackId="matching" fill="#93C5FD" name="จับคู่-ผิด" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="memoryCorrect" stackId="memory" fill="#8B5CF6" name="ความจำ-ถูก" />
                        <Bar dataKey="memoryIncorrect" stackId="memory" fill="#C4B5FD" name="ความจำ-ผิด" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <span className={styles.statLabel}>สถิติคำตอบ</span>
                </div>

                <div className={styles.statItem}>
                  <div className={styles.statIcon}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.dailyStats} margin={{ top: 20, right: 20, bottom: 60, left: 20 }} maxBarSize={40}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis 
                          dataKey="dateStr" 
                          tick={{ fill: '#6b7280', fontSize: 12 }} 
                          axisLine={false}
                          tickLine={false}
                          angle={-45}
                          textAnchor="end"
                          height={60}
                          label={isMobile ? undefined : { value: 'วันที่', position: 'bottom', offset: 20, fontSize: 12, fill: '#6b7280' }}
                        />
                        <YAxis 
                          tick={{ fill: '#6b7280', fontSize: 12 }} 
                          axisLine={false}
                          tickLine={false}
                          label={isMobile ? undefined : { value: 'เวลา (วินาที)', angle: -90, position: 'insideLeft', offset: 15, fontSize: 12, fill: '#6b7280' }}
                        />
                        <RechartsTooltip 
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              const pData = payload[0].payload;
                              return (
                                <div style={{ backgroundColor: 'white', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
                                  <p style={{margin: 0, fontWeight: 'bold'}}>{label}</p>
                                  <p style={{margin: 0, color: '#6B7280'}}>เวลาเฉลี่ยรวม: {pData.avgSeconds} วินาที</p>
                                  <p style={{margin: 0, fontSize: '0.85em', color: '#666', paddingLeft: '10px'}}>- จับคู่: {pData.matchingAvgSeconds} วินาที</p>
                                  <p style={{margin: 0, fontSize: '0.85em', color: '#666', paddingLeft: '10px'}}>- ความจำ: {pData.memoryAvgSeconds} วินาที</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="avgSeconds" fill="#6B7280" name="เวลาเฉลี่ยต่อรอบ (วินาที)" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <span className={styles.statLabel}>สถิติเวลาเล่นเฉลี่ย</span>
                </div>

                <div className={styles.statItem}>
                  <div className={styles.statIcon}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.scatterStats} margin={{ top: 20, right: 20, bottom: 60, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis 
                          dataKey="dateStr" 
                          name="วันที่" 
                          tick={{ fill: '#6b7280', fontSize: 12 }} 
                          axisLine={false}
                          tickLine={false}
                          padding={{ left: 15, right: 15 }}
                          angle={-45}
                          textAnchor="end"
                          height={60}
                          label={isMobile ? undefined : { value: 'วันที่', position: 'bottom', offset: 20, fontSize: 12, fill: '#6b7280' }}
                        />
                        <YAxis 
                          type="number" 
                          dataKey="timeOfDay" 
                          name="เวลา" 
                          domain={[0, 24]} 
                          tickFormatter={(val) => `${Math.floor(val)}:00`} 
                          tick={{ fill: '#6b7280', fontSize: 12 }} 
                          axisLine={false}
                          tickLine={false}
                          width={60}
                          padding={{ top: 20, bottom: 20 }}
                          label={isMobile ? undefined : { value: 'เวลา (น.)', angle: -90, position: 'insideLeft', offset: -5, fontSize: 12, fill: '#6b7280' }}
                        />
                        <RechartsTooltip 
                          cursor={{ strokeDasharray: '3 3' }} 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const pData = payload[0].payload;
                              return (
                                <div style={{ backgroundColor: 'white', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
                                  <p style={{margin: 0, fontWeight: 'bold'}}>{pData.dateStr}</p>
                                  <p style={{margin: 0}}>เวลา: {pData.timeStr}</p>
                                  <p style={{margin: 0}}>ระยะเวลา: {pData.duration} วินาที</p>
                                  <p style={{margin: 0}}>โหมด: {pData.mode}</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Line type="monotone" dataKey="timeOfDay" stroke="#8884d8" strokeWidth={3} dot={{r: 4, fill: '#8884d8', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} name="ประวัติการเล่น" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <span className={styles.statLabel}>สถิติช่วงเวลา</span>
                </div>

                <div className={styles.statItem}>
                  <div className={styles.statIcon}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.dailyStats} margin={{ top: 20, right: 20, bottom: 60, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis 
                          dataKey="dateStr" 
                          name="วันที่" 
                          tick={{ fill: '#6b7280', fontSize: 12 }} 
                          axisLine={false}
                          tickLine={false}
                          padding={{ left: 15, right: 15 }}
                          angle={-45}
                          textAnchor="end"
                          height={60}
                          label={isMobile ? undefined : { value: 'วันที่', position: 'bottom', offset: 20, fontSize: 12, fill: '#6b7280' }}
                        />
                        <YAxis 
                          type="number" 
                          dataKey="totalMinutes" 
                          name="เวลารวม (นาที)" 
                          tick={{ fill: '#6b7280', fontSize: 12 }} 
                          axisLine={false}
                          tickLine={false}
                          padding={{ top: 30, bottom: 20 }}
                          label={isMobile ? undefined : { value: 'เวลารวม (นาที)', angle: -90, position: 'insideLeft', offset: 15, fontSize: 12, fill: '#6b7280' }}
                        />
                        <RechartsTooltip 
                          cursor={{ strokeDasharray: '3 3' }} 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const pData = payload[0].payload;
                              return (
                                <div style={{ backgroundColor: 'white', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
                                  <p style={{margin: 0, fontWeight: 'bold'}}>{pData.dateStr}</p>
                                  <p style={{margin: 0}}>เวลารวม: {pData.totalMinutes} นาที</p>
                                  <p style={{margin: 0}}>จำนวนที่เล่นรวม: {pData.plays} รอบ</p>
                                  <p style={{margin: 0, fontSize: '0.85em', color: '#666'}}>- จับคู่: {pData.matchingPlays} รอบ</p>
                                  <p style={{margin: 0, fontSize: '0.85em', color: '#666'}}>- ความจำ: {pData.memoryPlays} รอบ</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Line type="monotone" dataKey="totalMinutes" stroke="#8884d8" strokeWidth={3} dot={{r: 4, fill: '#8884d8', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} name="สถิติผลรวมช่วงเวลา" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <span className={styles.statLabel}>สถิติผลรวมช่วงเวลา</span>
                </div>

              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem' }}>ไม่มีข้อมูลสถิติ</div>
            )}
          </div>
        </div>
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PatientStatsPopup;


