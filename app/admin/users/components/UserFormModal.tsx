"use client";

import { useState, useEffect } from "react";
import styles from "../users.module.css";

interface User {
  user_id: number;
  user_name: string;
  full_name: string;
  role: number;
  exercises_id?: number | null;
}

interface Exercise {
  exercises_id: number;
  exercises_name: string;
}

interface UserFormModalProps {
  user: User | null;
  role: number; // 1 for patient, 2 for staff
  onClose: () => void;
  onSave: () => void;
}

export default function UserFormModal({ user, role, onClose, onSave }: UserFormModalProps) {
  const isEditing = !!user;
  const [loading, setLoading] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [error, setError] = useState("");

  const initialExercises = user?.exercises_id
    ? String(user.exercises_id).split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id))
    : [];

  const [formData, setFormData] = useState({
    user_name: user?.user_name || "",
    full_name: user?.full_name || "",
    password: "", // Only set if changing/creating
    exercises_id: initialExercises as number[],
  });

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchExercise, setSearchExercise] = useState("");

  const handleCheckboxChange = (exId: number) => {
    setFormData(prev => {
      const isSelected = prev.exercises_id.includes(exId);
      if (isSelected) {
        return { ...prev, exercises_id: prev.exercises_id.filter((id: number) => id !== exId) };
      } else {
        return { ...prev, exercises_id: [...prev.exercises_id, exId] };
      }
    });
  };

  const filteredExercises = exercises.filter(ex => 
    ex.exercises_name.toLowerCase().includes(searchExercise.toLowerCase())
  );

  useEffect(() => {
    if (role === 1) {
      // Fetch exercises for patient dropdown
      fetch('/api/admin/exercises')
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setExercises(data.data);
          }
        })
        .catch(err => console.error("Failed to fetch exercises", err));
    }
  }, [role]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload: any = {
        user_name: formData.user_name,
        full_name: formData.full_name,
        role: role
      };

      if (formData.password) {
        payload.password = formData.password;
      }
      
      if (role === 1 && formData.exercises_id) {
        payload.exercises_id = formData.exercises_id;
      }

      let res;
      if (isEditing) {
        res = await fetch(`/api/admin/users/${user.user_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`/api/admin/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      const result = await res.json();
      if (result.success) {
        onSave();
      } else {
        setError(result.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      }
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setLoading(false);
    }
  };

  if (role === 2) {
    return (
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={styles.modalContentStaff} onClick={e => e.stopPropagation()}>
          <div className={styles.modalHeaderStaff}>
            <h2 className={styles.modalTitleStaff}>
              {isEditing ? 'แก้ไขข้อมูลเจ้าหน้าที่' : 'เพิ่มข้อมูลเจ้าหน้าที่'}
            </h2>
            <button className={styles.closeBtnStaff} onClick={onClose}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div className={styles.modalBodyStaff}>
            {error && <div style={{ color: '#ef4444', marginBottom: '1rem', padding: '0.5rem', background: '#fee2e2', borderRadius: '8px' }}>{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label className={styles.labelStaff}>อีเมล (บัญชี Google)</label>
                <input 
                  type="email"
                  name="user_name"
                  className={styles.inputStaff}
                  value={formData.user_name}
                  onChange={handleChange}
                  required
                  placeholder="example@gmail.com"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.labelStaff}>ชื่อ - นามสกุล</label>
                <input 
                  type="text" 
                  name="full_name"
                  className={styles.inputStaff}
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                  placeholder="กรอกชื่อ - นามสกุล"
                />
              </div>

              <div className={styles.modalActionsStaff}>
                <button type="submit" className={styles.saveBtnStaff} disabled={loading}>
                  {loading ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
                <button type="button" className={styles.cancelBtnStaff} onClick={onClose} disabled={loading}>
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContentPatient} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeaderStaff}>
          <h2 className={styles.modalTitleStaff}>
            {isEditing ? 'แก้ไขข้อมูลผู้ป่วย' : 'เพิ่มข้อมูลผู้ป่วย'}
          </h2>
          <button className={styles.closeBtnStaff} onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className={styles.modalBodyStaff}>
          {error && <div style={{ color: '#ef4444', marginBottom: '1rem', padding: '0.5rem', background: '#fee2e2', borderRadius: '8px' }}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label className={styles.labelStaff}>ชื่อ - นามสกุล</label>
              <input 
                type="text" 
                name="full_name"
                className={styles.inputStaff}
                value={formData.full_name}
                onChange={handleChange}
                required
              />
            </div>

            <div className={styles.formRow2Col}>
              <div className={styles.formGroup} style={{marginBottom: 0}}>
                <label className={styles.labelStaff}>รหัสผู้ป่วย</label>
                <input 
                  type="text"
                  name="user_name"
                  className={styles.inputStaff}
                  value={formData.user_name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className={styles.formGroup} style={{marginBottom: 0}}>
                <label className={styles.labelStaff}>
                  รหัสผ่าน
                </label>
                <input 
                  type="password" 
                  name="password"
                  className={styles.inputStaff}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={isEditing ? "(เว้นว่างถ้าไม่เปลี่ยน)" : ""}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.labelStaff}>ชุดแบบฝึกหัดเริ่มต้น</label>
              <div className={styles.multiSelectContainer}>
                <input 
                  type="text"
                  className={styles.multiSelectInput}
                  placeholder={
                    formData.exercises_id.length > 0
                      ? `เลือกแล้ว ${formData.exercises_id.length} ชุด (สามารถกรอกเพื่อค้นหาได้)`
                      : "สามารถกรอกเพื่อค้นหาได้"
                  }
                  value={searchExercise}
                  onChange={(e) => {
                    setSearchExercise(e.target.value);
                    setDropdownOpen(true);
                  }}
                  onClick={() => setDropdownOpen(true)}
                />
                <span className={styles.multiSelectArrow}>▼</span>
                
                {dropdownOpen && (
                  <div className={styles.multiSelectDropdown}>
                    {filteredExercises.length > 0 ? (
                      <div className={styles.multiSelectGrid}>
                        {filteredExercises.map(ex => (
                          <label key={ex.exercises_id} className={styles.checkboxItem}>
                            <input 
                              type="checkbox"
                              checked={formData.exercises_id.includes(ex.exercises_id)}
                              onChange={() => handleCheckboxChange(ex.exercises_id)}
                            />
                            {ex.exercises_name}
                          </label>
                        ))}
                      </div>
                    ) : (
                      <div style={{textAlign: 'center', color: '#666', padding: '0.5rem'}}>ไม่พบแบบฝึกหัด</div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Overlay to close dropdown when clicking outside */}
              {dropdownOpen && (
                <div 
                  style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99}} 
                  onClick={() => setDropdownOpen(false)}
                />
              )}
            </div>

            <div className={styles.modalActionsStaff}>
              <button type="submit" className={styles.saveBtnStaff} disabled={loading}>
                {loading ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
              <button type="button" className={styles.cancelBtnStaff} onClick={onClose} disabled={loading}>
                ยกเลิก
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
