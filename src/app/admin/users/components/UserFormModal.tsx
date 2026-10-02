"use client";

import { useState, useEffect } from "react";
import styles from "../users.module.css";
import RestoreConfirmModal from "@/app/components/Admin/RestoreConfirmModal";
import Loader from "@/app/components/Loader/Loader";
import { useScrollLock } from "@/app/hooks/useScrollLock";

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
  onSave: (savedUser?: User, originalUserId?: number) => void;
}

export default function UserFormModal({ user, role, onClose, onSave }: UserFormModalProps) {
  useScrollLock(true);
  const isEditing = !!user;
  const [loading, setLoading] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [error, setError] = useState("");
  const [restoreUserId, setRestoreUserId] = useState<number | null>(null);

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
  const [showPassword, setShowPassword] = useState(false);

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

  const filteredExercises = exercises
    .filter(ex => 
      ex.exercises_name.toLowerCase().includes(searchExercise.toLowerCase())
    )
    .sort((a, b) => {
      const aSelected = formData.exercises_id.includes(a.exercises_id);
      const bSelected = formData.exercises_id.includes(b.exercises_id);
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      return 0;
    });

  useEffect(() => {
    if (role === 1) {
      // Fetch exercises for patient dropdown
      const timestamp = Date.now();
      fetch(`/api/admin/exercises?t=${timestamp}`, { cache: 'no-store' })
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

    if (role === 1 && (!formData.exercises_id || formData.exercises_id.length === 0)) {
      setError("กรุณาเลือกชุดแบบฝึกหัดเริ่มต้นอย่างน้อย 1 ชุด");
      setLoading(false);
      return;
    }

    if (role === 2) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(formData.user_name)) {
        setError("รูปแบบอีเมลไม่ถูกต้อง");
        setLoading(false);
        return;
      }
    }

    try {
      const payload: Record<string, unknown> = {
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
        const savedUser: User = {
          user_id: isEditing ? user.user_id : result.data?.user_id || 0,
          user_name: formData.user_name,
          full_name: formData.full_name,
          role: role,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          exercises_id: role === 1 && formData.exercises_id.length > 0 ? (formData.exercises_id.join(',') as any) : null
        };
        onSave(savedUser, isEditing ? user.user_id : undefined);
      } else if (result.requireRestore) {
        setRestoreUserId(result.existingUserId);
      } else {
        setError(result.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      }
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!restoreUserId) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/users/${restoreUserId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore' })
      });
      const result = await res.json();
      if (result.success) {
        // Apply new payload
        const payload: Record<string, unknown> = {
          user_name: formData.user_name,
          full_name: formData.full_name,
          role: role
        };
        if (formData.password) payload.password = formData.password;
        if (role === 1 && formData.exercises_id) payload.exercises_id = formData.exercises_id;

        await fetch(`/api/admin/users/${restoreUserId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        // Delete old user if edit
        if (isEditing && user?.user_id && user.user_id !== restoreUserId) {
          await fetch(`/api/admin/users/${user.user_id}`, { method: 'DELETE' });
        }

        const savedUser: User = {
          user_id: restoreUserId,
          user_name: formData.user_name,
          full_name: formData.full_name,
          role: role,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          exercises_id: role === 1 && formData.exercises_id.length > 0 ? (formData.exercises_id.join(',') as any) : null
        };
        
        onSave(savedUser, isEditing ? user.user_id : undefined);
      } else {
        setError(result.error || "เกิดข้อผิดพลาดในการกู้คืนข้อมูล");
        setRestoreUserId(null);
      }
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ");
      setRestoreUserId(null);
    } finally {
      setLoading(false);
    }
  };

  const renderRestoreModal = () => {
    if (!restoreUserId) return null;
    return (
      <RestoreConfirmModal 
        onConfirm={handleRestore}
        onCancel={() => setRestoreUserId(null)}
      />
    );
  };

  if (role === 2) {
    return (
      <div className={styles.modalOverlay} onMouseDown={onClose}>
        <div className={styles.modalContentStaff} onMouseDown={e => e.stopPropagation()}>
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
                <label className={styles.labelStaff}>ชื่อ - นามสกุล</label>
                <input 
                  type="text" 
                  name="full_name"
                  className={styles.inputStaff}
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                  placeholder="กรอกชื่อ - นามสกุล"
                  maxLength={200}
                />
              </div>

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
                  maxLength={200}
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
          {renderRestoreModal()}
        </div>
        {loading && <Loader fullScreen text="กำลังดำเนินการ..." />}
      </div>
    );
  }

  return (
    <div className={styles.modalOverlay} onMouseDown={onClose}>
      <div className={styles.modalContentStaff} onMouseDown={e => e.stopPropagation()}>
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
                maxLength={200}
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
                  maxLength={20}
                />
              </div>

              <div className={styles.formGroup} style={{marginBottom: 0}}>
                <label className={styles.labelStaff}>
                  รหัสผ่าน
                </label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    name="password"
                    className={styles.inputStaff}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder={isEditing ? "(เว้นว่างถ้าไม่เปลี่ยน)" : ""}
                    style={{ paddingRight: '2.5rem' }}
                    minLength={isEditing ? undefined : 6}
                    maxLength={200}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '0.8rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#666',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 0
                    }}
                  >
                    {showPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.labelStaff}>ชุดแบบฝึกหัดเริ่มต้น</label>
              <div className={styles.multiSelectContainer}>
                <input 
                  type="text"
                  className={`${styles.multiSelectInput} ${dropdownOpen ? styles.multiSelectInputOpen : ''}`}
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
                  maxLength={200}
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
        {renderRestoreModal()}
      </div>
      {loading && <Loader fullScreen text="กำลังดำเนินการ..." />}
    </div>
  );
}

