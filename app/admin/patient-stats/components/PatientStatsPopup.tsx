import React, { useEffect, useState } from 'react';
import styles from './PatientStatsPopup.module.css';
import { 
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, ComposedChart, Legend,
  ScatterChart, Scatter, ZAxis
} from 'recharts';

interface PatientStatsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  patientId?: string; // Optional, might be used to fetch specific stats later
  categories?: string[];
  exerciseSets?: string[];
}

const PatientStatsPopup: React.FC<PatientStatsPopupProps> = ({ isOpen, onClose, patientId, categories = [], exerciseSets = [] }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [exerciseSetFilter, setExerciseSetFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (isOpen && patientId) {
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
          <div className={styles.filtersWrapper}>
            <div className={styles.filters}>
              <select 
                className={styles.filterSelect}
                value={periodFilter}
                onChange={(e) => setPeriodFilter(e.target.value)}
              >
                <option value="all">ทุกช่วงเวลา</option>
                <option value="today">วันนี้</option>
                <option value="last7">7 วันล่าสุด</option>
                <option value="last30">30 วันล่าสุด</option>
                <option value="thisMonth">เดือนนี้</option>
                <option value="custom">กำหนดเอง</option>
              </select>
              <select 
                className={styles.filterSelect}
                value={exerciseSetFilter}
                onChange={(e) => setExerciseSetFilter(e.target.value)}
              >
                <option value="all">ทุกชุดแบบฝึกหัด</option>
                {exerciseSets.map(set => (
                  <option key={set} value={set}>{set}</option>
                ))}
              </select>
              <select 
                className={styles.filterSelect}
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">ทุกหมวดหมู่</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
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

          <div className={styles.statsSection}>
            <h3 className={styles.sectionTitle}>สถิติคะแนน</h3>
            
            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>กำลังโหลดข้อมูลสถิติ...</div>
            ) : data && data.dailyStats ? (
              <div className={styles.statsGrid}>
                <div className={styles.statItem}>
                  <div className={styles.statIcon}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieTotalData} cx="50%" cy="50%" innerRadius={0} outerRadius={80} dataKey="value" stroke="none" label>
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
                        <Pie data={pieSepData} cx="50%" cy="50%" innerRadius={40} outerRadius={80} dataKey="value" stroke="#fff" label>
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
                      <BarChart data={data.dailyStats}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="dateStr" tick={{fontSize: 12}} />
                        <YAxis tick={{fontSize: 12}} />
                        <RechartsTooltip />
                        <Legend verticalAlign="bottom" height={36} />
                        <Bar dataKey="correct" stackId="a" fill="#10B981" name="ตอบถูก" />
                        <Bar dataKey="incorrect" stackId="a" fill="#EF4444" name="ตอบผิด" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <span className={styles.statLabel}>สถิติคำตอบ</span>
                </div>

                <div className={styles.statItem}>
                  <div className={styles.statIcon}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.dailyStats}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="dateStr" tick={{fontSize: 12}} />
                        <YAxis tick={{fontSize: 12}} />
                        <RechartsTooltip />
                        <Legend verticalAlign="bottom" height={36} />
                        <Line type="monotone" dataKey="avgSeconds" stroke="#6B7280" strokeWidth={3} dot={{r: 3}} name="เวลาเฉลี่ย (วินาที)" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <span className={styles.statLabel}>สถิติเวลาเล่นเฉลี่ย</span>
                </div>

                <div className={styles.statItem}>
                  <div className={styles.statIcon}>
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          type="number" 
                          dataKey="timeOfDay" 
                          name="เวลา" 
                          domain={[0, 24]} 
                          tickFormatter={(val) => `${Math.floor(val)}:00`} 
                          tick={{fontSize: 12}} 
                        />
                        <YAxis 
                          type="category" 
                          dataKey="dateStr" 
                          name="วันที่" 
                          tick={{fontSize: 12}} 
                          width={80}
                        />
                        <ZAxis 
                          type="number" 
                          dataKey="duration" 
                          range={[60, 400]} 
                          name="ระยะเวลา (วินาที)" 
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
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Scatter data={data.scatterStats} fill="#8884d8" name="ประวัติการเล่น" />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                  <span className={styles.statLabel}>สถิติช่วงเวลา</span>
                </div>

                <div className={styles.statItem}>
                  <div className={styles.statIcon}>
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={data.dailyStats}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="dateStr" tick={{fontSize: 12}} />
                        <YAxis yAxisId="left" tick={{fontSize: 12}} />
                        <YAxis yAxisId="right" orientation="right" tick={{fontSize: 12}} />
                        <RechartsTooltip />
                        <Legend verticalAlign="bottom" height={36} />
                        <Bar yAxisId="left" dataKey="totalSeconds" fill="transparent" stroke="#60A5FA" strokeWidth={3} barSize={10} name="เวลารวม (วินาที)" />
                        <Line yAxisId="right" type="monotone" dataKey="answers" stroke="#4B5563" strokeWidth={3} dot={{r: 4, fill: 'white', stroke: '#4B5563', strokeWidth: 3}} name="จำนวนคำตอบ" />
                      </ComposedChart>
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
