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
  const [restoreUserId, setRestoreUserId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    user_name: user?.user_name || "",
    full_name: user?.full_name || "",
    password: "", // Only set if changing/creating
    exercises_id: user?.exercises_id || "",
  });

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
      } else if (result.requireRestore) {
        setRestoreUserId(result.existingUserId);
      } else {
        setError(result.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      }
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ");
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
        onSave(); // Close modal and refresh users list
      } else {
        setError(result.error || "เกิดข้อผิดพลาดในการกู้คืนข้อมูล");
        setRestoreUserId(null);
      }
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ");
      setRestoreUserId(null);
    } finally {
      setLoading(false);
    }
  };

  const renderRestoreModal = () => {
    if (!restoreUserId) return null;
    return (
      <div className={styles.restoreModalOverlay} onClick={() => setRestoreUserId(null)}>
        <div className={styles.restoreModalContent} onClick={e => e.stopPropagation()}>
          <div className={styles.restoreModalIcon}>
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 2.1l4 4-4 4"/>
              <path d="M3 12.2v-2a4 4 0 0 1 4-4h14"/>
              <path d="M7 21.9l-4-4 4-4"/>
              <path d="M21 11.8v2a4 4 0 0 1-4 4H3"/>
            </svg>
          </div>
          <h2 className={styles.restoreModalTitle}>พบข้อมูลเดิมในระบบ</h2>
          <p className={styles.restoreModalSubTitle}>ต้องการกู้คืนข้อมูลที่เคยลบหรือไม่</p>
          <div className={styles.deleteModalActions}>
            <button className={styles.restoreBtnConfirm} onClick={handleRestore} disabled={loading}>
              {loading ? 'กำลังกู้คืน...' : 'กู้คืนข้อมูล'}
            </button>
            <button className={styles.deleteBtnConfirm} onClick={() => setRestoreUserId(null)} disabled={loading}>
              ยกเลิก
            </button>
          </div>
        </div>
      </div>
    );
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
      </div>
    );
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            {isEditing ? 'แก้ไข' : 'เพิ่ม'}{role === 1 ? 'ผู้ป่วย' : 'เจ้าหน้าที่'}
          </h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {error && <div style={{ color: '#ef4444', marginBottom: '1rem', padding: '0.5rem', background: '#fee2e2', borderRadius: '8px' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label}>{role === 1 ? 'รหัสผู้ป่วย' : 'อีเมล (บัญชี Google)'}</label>
            <input 
              type={role === 1 ? "text" : "email"}
              name="user_name"
              className={styles.input}
              value={formData.user_name}
              onChange={handleChange}
              required
              placeholder={role === 1 ? 'กรอกรหัสผู้ป่วย' : 'example@gmail.com'}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>ชื่อ - นามสกุล</label>
            <input 
              type="text" 
              name="full_name"
              className={styles.input}
              value={formData.full_name}
              onChange={handleChange}
              required
              placeholder="กรอกชื่อ - นามสกุล"
            />
          </div>

          {role === 1 && (
            <div className={styles.formGroup}>
              <label className={styles.label}>
                รหัสผ่าน {isEditing && <span style={{fontSize: '0.85em', color: '#888'}}>(เว้นว่างไว้หากไม่ต้องการเปลี่ยน)</span>}
              </label>
              <input 
                type="password" 
                name="password"
                className={styles.input}
                value={formData.password}
                onChange={handleChange}
                placeholder={isEditing ? "ตั้งรหัสผ่านใหม่" : "ตั้งรหัสผ่าน (ถ้าว่างจะใช้รหัสผู้ใช้)"}
              />
            </div>
          )}

          {role === 1 && (
            <div className={styles.formGroup}>
              <label className={styles.label}>ชุดแบบฝึกหัด</label>
              <select 
                name="exercises_id" 
                className={styles.select}
                value={formData.exercises_id}
                onChange={handleChange}
                required
              >
                <option value="">-- เลือกชุดแบบฝึกหัด --</option>
                {exercises.map(ex => (
                  <option key={ex.exercises_id} value={ex.exercises_id}>
                    {ex.exercises_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className={styles.modalActions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={loading}>
              ยกเลิก
            </button>
            <button type="submit" className={styles.saveBtn} disabled={loading}>
              {loading ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
          </div>
        </form>
        {renderRestoreModal()}
      </div>
    </div>
  );
}
