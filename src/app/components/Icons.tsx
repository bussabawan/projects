import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
}

export const PuzzleIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    {...props}
  >
    <g transform="rotate(45 12 12)">
      <defs>
        <mask id="puzzle-holes">
          <rect x="-10" y="-10" width="44" height="44" fill="white" />
          <circle cx="12" cy="18" r="2.5" fill="black" />
          <circle cx="6" cy="12" r="2.5" fill="black" />
        </mask>
      </defs>
      <g mask="url(#puzzle-holes)">
        <rect x="6" y="6" width="12" height="12" rx="1.5" fill="#34D399" />
      </g>
      <circle cx="12" cy="6" r="2.5" fill="#FBBF24" />
      <circle cx="18" cy="12" r="2.5" fill="#A78BFA" />
    </g>
  </svg>
);

export const BrainIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    {...props}
  >
    <g fill="#F472B6">
      <circle cx="8" cy="10" r="4" />
      <circle cx="7" cy="14" r="3" />
      <circle cx="10" cy="16.5" r="3.5" />
      <circle cx="16" cy="10" r="4" />
      <circle cx="17" cy="14" r="3" />
      <circle cx="14" cy="16.5" r="3.5" />
      <circle cx="12" cy="8" r="3.5" />
      <rect x="7" y="9" width="10" height="8" rx="2" />
      <rect x="9" y="12" width="6" height="6" rx="2" />
    </g>
    <path d="M12 5v13.5" stroke="#DB2777" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M8 10c1-2 3-1 3-1" stroke="#DB2777" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    <path d="M16 10c-1-2-3-1-3-1" stroke="#DB2777" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    <path d="M7 14c1-1 3 0 3 0" stroke="#DB2777" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    <path d="M17 14c-1-1-3 0-3 0" stroke="#DB2777" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    <path d="M11 18h2l1 3h-4z" fill="#F472B6" />
  </svg>
);

export const PersonIcon: React.FC<IconProps> = ({ size = 24, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    {...props}
  >
    {/* Head */}
    <circle cx="12" cy="5" r="2.5" fill="#FCD34D" />
    
    {/* Torso (Shirt) */}
    <rect x="9" y="8" width="6" height="7" rx="1" fill="#F59E0B" />
    
    {/* Left Arm */}
    <rect x="7" y="8" width="2" height="6" rx="1" fill="#F59E0B" />
    <circle cx="8" cy="14" r="1" fill="#FCD34D" />
    
    {/* Right Arm */}
    <rect x="15" y="8" width="2" height="6" rx="1" fill="#F59E0B" />
    <circle cx="16" cy="14" r="1" fill="#FCD34D" />
    
    {/* Left Leg */}
    <rect x="9.5" y="15" width="2.5" height="7" rx="0.5" fill="#4F46E5" />
    
    {/* Right Leg */}
    <rect x="12" y="15" width="2.5" height="7" rx="0.5" fill="#4F46E5" />
    
    {/* Shoes */}
    <path d="M9 22h3v1H9z" fill="#1F2937" />
    <path d="M12 22h3v1h-3z" fill="#1F2937" />
  </svg>
);
