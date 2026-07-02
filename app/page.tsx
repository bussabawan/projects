"use client";

import { useState } from "react";
import styles from "./page.module.css";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setUploadedUrl(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setUploadedUrl(data.url);
      } else {
        alert(`Upload failed: ${data.error}`);
      }
    } catch (err) {
      alert("An error occurred during upload.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <main className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>File Upload</h1>
        <p className={styles.subtitle}>Upload your files to the Next.js server.</p>

        <form onSubmit={handleUpload} className={styles.form}>
          <div className={styles.fileInputWrapper}>
            <input
              type="file"
              id="file"
              className={styles.fileInput}
              onChange={handleFileChange}
            />
            <label htmlFor="file" className={styles.fileLabel}>
              {file ? file.name : "Choose a file..."}
            </label>
          </div>
          <button 
            type="submit" 
            className={styles.button}
            disabled={!file || uploading}
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </form>

        {uploadedUrl && (
          <div className={styles.successBox}>
            <p className={styles.successText}>File uploaded successfully!</p>
            <a href={uploadedUrl} target="_blank" rel="noopener noreferrer" className={styles.link}>
              View File
            </a>
          </div>
        )}
      </div>
    </main>
  );
}
