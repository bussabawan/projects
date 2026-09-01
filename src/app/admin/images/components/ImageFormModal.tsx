"use client";

import { useState } from "react";
import Image from "next/image";
import styles from "./ImageFormModal.module.css";

interface ImageData {
  id: number;
  title: string;
  imageUrl: string;
  audioUrl?: string;
  audioTitle?: string;
  audioGen?: number;
}

interface ImageFormModalProps {
  image?: ImageData | null;
  onClose: () => void;
  onSave?: (data: Record<string, unknown>) => void | Promise<void>;
}

export default function ImageFormModal({ image, onClose, onSave }: ImageFormModalProps) {
  const [imageName, setImageName] = useState(image?.title || "");
  const [useAutoSpeech, setUseAutoSpeech] = useState(image ? image.audioGen === 1 : true);
  const [speechText, setSpeechText] = useState(image?.audioTitle || "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(image?.imageUrl || null);
  const [imageError, setImageError] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [ttsError, setTtsError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        return data.url;
      }
      throw new Error(data.error || "Upload failed");
    } catch (err) {
      console.error("Upload error:", err);
      return null;
    }
  };

  const handleSave = async () => {
    let uploadedImageUrl = image?.imageUrl || null;
    let uploadedAudioUrl = image?.audioUrl || null;

    if (!imageFile && !uploadedImageUrl) {
      setValidationError("กรุณาเลือกรูปภาพก่อนบันทึก");
      return;
    }

    if (useAutoSpeech) {
      if (!speechText.trim()) {
        setValidationError("กรุณากรอกข้อความเสียงก่อนบันทึก");
        return;
      }
    } else {
      if (!audioFile && !uploadedAudioUrl) {
        setValidationError("กรุณาเลือกไฟล์เสียงก่อนบันทึก");
        return;
      }
    }

    setValidationError(null);
    setIsSaving(true);
    try {
      if (imageFile) {
        uploadedImageUrl = await uploadFile(imageFile);
      }

      if (useAutoSpeech && speechText.trim()) {
        if (speechText !== image?.audioTitle || !useAutoSpeech === (image?.audioGen === 0)) {
           const res = await fetch(`/api/tts?text=${encodeURIComponent(speechText)}`);
           if (res.ok) {
             const blob = await res.blob();
             const ttsFile = new File([blob], `tts-${Date.now()}.mp3`, { type: 'audio/mpeg' });
             uploadedAudioUrl = await uploadFile(ttsFile);
           } else {
             console.error("Failed to generate TTS audio");
             throw new Error("TTS_FAILED");
           }
        }
      } else if (!useAutoSpeech && audioFile) {
        uploadedAudioUrl = await uploadFile(audioFile);
      }

      if (onSave) {
        await onSave({
          imageName,
          useAutoSpeech,
          speechText: useAutoSpeech ? speechText : "",
          imageUrl: uploadedImageUrl,
          audioUrl: uploadedAudioUrl
        });
      }
      // onClose will be handled by the parent component after successful save
    } catch (error: unknown) {
      const err = error as Error;
      console.error("Save error", err);
      if (err.message === "TTS_FAILED") {
        setTtsError("สร้างเสียงไม่สมบูรณ์ กรุณาลองใหม่");
      } else {
        alert("เกิดข้อผิดพลาดในการบันทึก");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreviewUrl(URL.createObjectURL(file));
      setImageError(false);
    }
  };

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAudioFile(e.target.files[0]);
    }
  };

  const playTTSPreview = async () => {
    if (!speechText.trim() || isPlaying) return;
    
    setIsPlaying(true);
    setTtsError(null);
    try {
      const audio = new Audio(`/api/tts?text=${encodeURIComponent(speechText)}`);
      
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => {
        setIsPlaying(false);
        setTtsError("ไม่สามารถสร้างหรือเล่นเสียงได้");
      };
      
      await audio.play();
    } catch (e) {
      console.error(e);
      setIsPlaying(false);
      setTtsError("ไม่สามารถสร้างหรือเล่นเสียงได้");
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          {image ? "แก้ไขข้อมูลรูปภาพ" : "เพิ่มข้อมูลรูปภาพ"}
        </div>
        
        <div className={styles.body}>
          <div className={styles.columns}>
            {/* Left Column */}
            <div className={styles.leftCol}>
              <div className={styles.formGroup}>
                <label className={styles.label}>ชื่อรูปภาพ</label>
                <input 
                  type="text" 
                  className={styles.inputField} 
                  value={imageName}
                  onChange={(e) => setImageName(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>แหล่งที่มาของเสียง (Audio Source)</label>
                <div className={styles.toggleRow}>
                  <label className={styles.switch}>
                    <input 
                      type="checkbox" 
                      checked={useAutoSpeech}
                      onChange={(e) => setUseAutoSpeech(e.target.checked)}
                    />
                    <span className={styles.slider}></span>
                  </label>
                  <span className={styles.toggleLabel}>ใช้เสียงพูดอัตโนมัติ</span>
                </div>
                
                {useAutoSpeech ? (
                  <div style={{ width: '100%' }}>
                    <div className={styles.inputWithIcon}>
                      <input 
                        type="text" 
                        placeholder="ข้อความที่ต้องการให้ระบบอ่าน" 
                        value={speechText}
                        onChange={(e) => {
                          setSpeechText(e.target.value);
                          setTtsError(null);
                        }}
                      />
                    <div 
                      className={styles.iconInside} 
                      onClick={playTTSPreview} 
                      style={{ cursor: speechText.trim() ? 'pointer' : 'default', opacity: isPlaying ? 0.5 : 1 }}
                      title="ฟังเสียงตัวอย่าง"
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                      </svg>
                    </div>
                  </div>
                  {ttsError && <div className={styles.errorText}>{ttsError}</div>}
                </div>
                ) : (
                  <label className={styles.fileInputContainer}>
                    <input type="file" accept="audio/*" onChange={handleAudioChange} />
                    <div className={styles.fileInputBtnFake}>เลือกไฟล์เสียง</div>
                    <span className={styles.fileInputName}>
                      {audioFile ? audioFile.name : ""}
                    </span>
                  </label>
                )}
                {validationError && <div className={styles.errorText} style={{marginTop: '0.5rem'}}>{validationError}</div>}
              </div>
            </div>

            {/* Right Column */}
            <div className={styles.rightCol}>
              <div className={styles.imagePreview}>
                {imagePreviewUrl && !imageError ? (
                  <>
                    <Image 
                      src={imagePreviewUrl.startsWith('/') || imagePreviewUrl.startsWith('blob:') ? imagePreviewUrl : `/api/uploads/${imagePreviewUrl}`} 
                      alt="Preview" 
                      width={400}
                      height={400}
                      style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '12px' }} 
                      onError={() => setImageError(true)}
                      unoptimized
                    />
                  </>
                ) : (
                  <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ background: '#fff', borderRadius: '12px' }}>
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeWidth="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21" strokeWidth="2"></polyline>
                    <rect x="6" y="6" width="18" height="18" rx="2" ry="2" strokeWidth="2" opacity="0.3"></rect>
                  </svg>
                )}
              </div>
              <label className={styles.uploadBtn}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                อัปโหลดรูป
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
              </label>
            </div>
          </div>
          
          {/* Footer */}
          <div className={styles.footer}>
            <button className={styles.saveBtn} onClick={handleSave} disabled={isSaving}>
              {isSaving ? "กำลังบันทึก..." : "บันทึก"}
            </button>
            <button className={styles.cancelBtn} onClick={onClose} disabled={isSaving}>
              ยกเลิก
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
