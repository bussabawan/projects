import React from 'react';
import styles from './LoadingSpinner.module.css';

interface LoadingSpinnerProps {
  text?: string;
  size?: 'small' | 'large';
  svgSize?: number;
}

export default function LoadingSpinner({ 
  text = 'กำลังโหลด...', 
  size = 'large',
  svgSize = 48 
}: LoadingSpinnerProps) {
  const containerClass = `${styles.loadingContainer} ${size === 'small' ? styles.small : styles.large}`;
  
  return (
    <div className={containerClass}>
      <svg width={svgSize} height={svgSize} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <g className={styles.spinnerSvg}>
          <circle cx="12" cy="3" r="2.5" fill="#333" />
          <circle cx="18.36" cy="5.64" r="2" fill="#333" />
          <circle cx="21" cy="12" r="1.5" fill="#333" />
          <circle cx="18.36" cy="18.36" r="1" fill="#333" />
          <circle cx="12" cy="21" r="1" fill="#333" />
          <circle cx="5.64" cy="18.36" r="1" fill="#333" />
          <circle cx="3" cy="12" r="1.5" fill="#333" />
          <circle cx="5.64" cy="5.64" r="2" fill="#333" />
        </g>
      </svg>
      {text && <p>{text}</p>}
    </div>
  );
}
