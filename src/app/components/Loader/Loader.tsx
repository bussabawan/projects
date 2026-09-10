'use client';

import React from 'react';
import styles from './Loader.module.css';

export interface LoaderProps {
  color?: string;
  size?: number | string;
  text?: string;
  center?: boolean;
  inline?: boolean;
  fullScreen?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export default function Loader({
  color = '#b55ab5',
  size = '2.25px',
  text,
  center = true,
  inline = false,
  fullScreen = false,
  className = '',
  style,
}: LoaderProps) {
  const sizeValue = typeof size === 'number' ? `${size}px` : size;

  const customStyle: React.CSSProperties = {
    ...style,
    ['--color-1' as string]: color,
    ['--size' as string]: sizeValue,
  };

  if (inline) {
    return (
      <span className={`${styles.inlineWrapper} ${className}`} style={customStyle}>
        <span className={styles.loader}></span>
      </span>
    );
  }

  const content = (
    <div className={`${styles.loaderContainer} ${className}`} style={customStyle}>
      <span className={styles.loader}></span>
      {text && <p className={styles.loaderText}>{text}</p>}
    </div>
  );

  if (fullScreen) {
    return <div className={styles.fullScreenWrapper}>{content}</div>;
  }

  if (center) {
    return <div className={styles.centerWrapper}>{content}</div>;
  }

  return content;
}
