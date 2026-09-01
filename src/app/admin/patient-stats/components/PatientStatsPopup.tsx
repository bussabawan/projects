import React, { useEffect, useState } from 'react';
import Skeleton from "@/app/components/Skeleton/Skeleton";
import styles from './PatientStatsPopup.module.css';
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

const extractCategory = (testSet?: string) => {
  if (!testSet) return '';
  let cat = testSet.replace(/^(?:แบบฝึกหัด\s*)?(?:หมวด\s*)?/, '');
  cat = cat.replace(/\s*เลเวล\s*\d*/g, '').trim();
  if (cat.includes('สิ่งของ')) {
    cat = 'สิ่งของ';
  }
  return cat;
};

const PatientStatsPopup: React.FC<PatientStatsPopupProps> = ({ isOpen, onClose, patientId, exerciseSets = [] }) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [exerciseSetFilter, setExerciseSetFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const baseExerciseSets = (data?.availableExerciseSets || exerciseSets) as string[];
  const dynamicCategories = Array.from(new Set<string>(baseExerciseSets.map(extractCategory)));
  const dynamicExerciseSets = categoryFilter !== 'all' 
    ? baseExerciseSets.filter(set => extractCategory(set) === categoryFilter)
    : baseExerciseSets;

  useEffect(() => {
    if (isOpen && patientId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(true);
      let url = `/api/patient-stats/${patientId}?category=${encodeURIComponent(categoryFilter)}&period=${periodFilter}&exerciseSet=${encodeURIComponent(exerciseSetFilter)}`;
      if (periodFilter === 'custom') {
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }
      fetch(url)
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
  }, [isOpen, patientId, categoryFilter, periodFilter, exerciseSetFilter, startDate, endDate]);

  if (!isOpen) return null;

  const PIE_COLORS = ['#10B981', '#EF4444']; // Green (Correct), Red (Incorrect)
  const pieTotalData = data ? [
    { name: 'ถูก', value: data.scoreStats.total.correct || 0 },
    { name: 'ผิด', value: data.scoreStats.total.incorrect || 0 },
  ] : [];

  const pieSepData = data ? [
    { name: 'จับคู่-ถูก', value: data.scoreStats.separated.matching.correct || 0 },
    { name: 'จับคู่-ผิด', value: data.scoreStats.separated.matching.incorrect || 0 },
    { name: 'ความจำ-ถูก', value: data.scoreStats.separated.memory.correct || 0 },
    { name: 'ความจำ-ผิด', value: data.scoreStats.separated.memory.incorrect || 0 },
  ] : [];
  const SEP_COLORS = ['#3B82F6', '#93C5FD', '#8B5CF6', '#C4B5FD'];

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.popup} onClick={(e) => e.stopPropagation()}>
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
                    จำนวน Login: <b>{data.dailyStats.reduce((acc: number, cur: Record<string, number>) => acc + (cur.logins || 0), 0)}</b> ครั้ง
                  </div>
                  <div style={{ background: '#ede9fe', padding: '6px 15px', borderRadius: '20px', fontSize: '0.9rem', color: '#5b21b6' }}>
                    ความจำ: <b>{data.dailyStats.reduce((acc: number, cur: Record<string, number>) => acc + (cur.memoryPlays || 0), 0)}</b> ครั้ง
                  </div>
                  <div style={{ background: '#dbeafe', padding: '6px 15px', borderRadius: '20px', fontSize: '0.9rem', color: '#1e40af' }}>
                    จับคู่: <b>{data.dailyStats.reduce((acc: number, cur: Record<string, number>) => acc + (cur.matchingPlays || 0), 0)}</b> ครั้ง
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
                <input 
                  type="date" 
                  className={styles.dateInput} 
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                />
                <span>ถึง</span>
                <input 
                  type="date" 
                  className={styles.dateInput} 
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                />
              </div>
            )}
          </div>
          </div>

          <div className={styles.statsSection}>
            <h3 className={styles.sectionTitle}>สถิติคะแนน</h3>
            
            {loading ? (
              <Skeleton type="card" count={4} />
            ) : data && data.dailyStats ? (
              <div className={styles.statsGrid}>
                <div className={styles.statItem}>
                  <div className={styles.statIcon}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieTotalData} cx="50%" cy="50%" innerRadius={40} outerRadius={80} dataKey="value" stroke="#fff" label={({ value }) => value > 0 ? value : ''}>
                          {pieTotalData.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                        </Pie>
                        <RechartsTooltip />
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
                        <Pie data={pieSepData} cx="50%" cy="50%" innerRadius={40} outerRadius={80} dataKey="value" stroke="#fff" label={({ value }) => value > 0 ? value : ''}>
                          {pieSepData.map((entry, index) => <Cell key={`cell-${index}`} fill={SEP_COLORS[index % SEP_COLORS.length]} />)}
                        </Pie>
                        <RechartsTooltip />
                        <Legend verticalAlign="bottom" height={36} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <span className={styles.statLabel}>แยก</span>
                </div>

                <div className={styles.statItem}>
                  <div className={styles.statIcon}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.dailyStats} maxBarSize={50}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="dateStr" tick={{fontSize: 12}} />
                        <YAxis tick={{fontSize: 12}} />
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
                        <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }} />
                        <Bar dataKey="matchingCorrect" stackId="matching" fill="#3B82F6" name="จับคู่-ถูก" />
                        <Bar dataKey="matchingIncorrect" stackId="matching" fill="#93C5FD" name="จับคู่-ผิด" />
                        <Bar dataKey="memoryCorrect" stackId="memory" fill="#8B5CF6" name="ความจำ-ถูก" />
                        <Bar dataKey="memoryIncorrect" stackId="memory" fill="#C4B5FD" name="ความจำ-ผิด" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <span className={styles.statLabel}>สถิติคำตอบ</span>
                </div>

                <div className={styles.statItem}>
                  <div className={styles.statIcon}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.dailyStats} margin={{ top: 20, right: 20, bottom: 30, left: 20 }} maxBarSize={50}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis 
                          dataKey="dateStr" 
                          tick={{fontSize: 12}} 
                          label={{ value: 'วันที่', position: 'bottom', offset: 5, fontSize: 12, fill: '#666' }}
                        />
                        <YAxis 
                          tick={{fontSize: 12}} 
                          label={{ value: 'เวลา (วินาที)', angle: -90, position: 'insideLeft', offset: 15, fontSize: 12, fill: '#666' }}
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
                        <Bar dataKey="avgSeconds" fill="#6B7280" name="เวลาเฉลี่ยต่อรอบ (วินาที)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <span className={styles.statLabel}>สถิติเวลาเล่นเฉลี่ย</span>
                </div>

                <div className={styles.statItem}>
                  <div className={styles.statIcon}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.scatterStats} margin={{ top: 20, right: 20, bottom: 30, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="dateStr" 
                          name="วันที่" 
                          tick={{fontSize: 12}} 
                          padding={{ left: 15, right: 15 }}
                          label={{ value: 'วันที่', position: 'bottom', offset: 5, fontSize: 12, fill: '#666' }}
                        />
                        <YAxis 
                          type="number" 
                          dataKey="timeOfDay" 
                          name="เวลา" 
                          domain={[0, 24]} 
                          tickFormatter={(val) => `${Math.floor(val)}:00`} 
                          tick={{fontSize: 12}} 
                          width={60}
                          padding={{ top: 20, bottom: 20 }}
                          label={{ value: 'เวลา (น.)', angle: -90, position: 'insideLeft', offset: -5, fontSize: 12, fill: '#666' }}
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
                        <Line type="monotone" dataKey="timeOfDay" stroke="#8884d8" strokeWidth={2} dot={{r: 4}} activeDot={{r: 6}} name="ประวัติการเล่น" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <span className={styles.statLabel}>สถิติช่วงเวลา</span>
                </div>

                <div className={styles.statItem}>
                  <div className={styles.statIcon}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.dailyStats} margin={{ top: 20, right: 20, bottom: 30, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="dateStr" 
                          name="วันที่" 
                          tick={{fontSize: 12}} 
                          padding={{ left: 15, right: 15 }}
                          label={{ value: 'วันที่', position: 'bottom', offset: 5, fontSize: 12, fill: '#666' }}
                        />
                        <YAxis 
                          type="number" 
                          dataKey="totalMinutes" 
                          name="เวลารวม (นาที)" 
                          tick={{fontSize: 12}} 
                          padding={{ top: 30, bottom: 20 }}
                          label={{ value: 'เวลารวม (นาที)', angle: -90, position: 'insideLeft', offset: 15, fontSize: 12, fill: '#666' }}
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
                        <Line type="monotone" dataKey="totalMinutes" stroke="#8884d8" strokeWidth={2} dot={{r: 4}} activeDot={{r: 6}} name="สถิติผลรวมช่วงเวลา" />
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
      </div>
    </div>
  );
};

export default PatientStatsPopup;
