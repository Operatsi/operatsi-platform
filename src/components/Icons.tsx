import React from "react";

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

export const GoogleIcon: React.FC<IconProps> = ({ size = 20, className = "", style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    style={{ ...style, fill: "var(--fillg, currentColor)" }}
    {...props}
  >
    <g clipPath="url(#clip0_4418_8998)">
      <path
        d="M21.74 11.07C21.69 10.56 21.26 10.18 20.75 10.18H13.2C12.65 10.18 12.2 10.63 12.2 11.18V12.89C12.2 13.44 12.65 13.89 13.2 13.89H17.71C17.6 14.81 17 16.2 15.67 17.13C14.82 17.72 13.69 18.13 12.2 18.13C12.13 18.13 12.07 18.13 12 18.12C9.44995 18.04 7.28996 16.33 6.50996 13.98C6.29996 13.35 6.17995 12.69 6.17995 12C6.17995 11.31 6.29995 10.64 6.49995 10.02C6.55995 9.83999 6.62995 9.66001 6.70995 9.48001C7.62995 7.41001 9.63995 5.95 12 5.88C12.06 5.87 12.13 5.87 12.2 5.87C13.63 5.87 14.7 6.33999 15.45 6.85999C15.84 7.12999 16.36 7.06999 16.7 6.73999L18.09 5.38C18.53 4.95 18.49 4.21999 17.99 3.85999C16.4 2.68999 14.46 2 12.2 2C12.13 2 12.07 2.00001 12 2.01001C8.16995 2.08001 4.87995 4.30001 3.26995 7.51001C2.58995 8.87001 2.19995 10.39 2.19995 12C2.19995 13.61 2.58995 15.13 3.26995 16.49H3.27995C4.88995 19.7 8.17995 21.92 12 21.99C12.07 22 12.13 22 12.2 22C14.9 22 17.17 21.11 18.82 19.58C20.71 17.83 21.8 15.27 21.8 12.22C21.8 11.79 21.78 11.42 21.74 11.07Z"
        fill="currentColor"
        style={{ fill: "var(--fillg, currentColor)" }}
      />
    </g>
    <defs>
      <clipPath id="clip0_4418_8998">
        <rect width="24" height="24" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

export const AppleIcon: React.FC<IconProps> = ({ size = 20, className = "", style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    style={{ ...style, fill: "var(--fillg, currentColor)" }}
    {...props}
  >
    <g clipPath="url(#clip0_4418_8987)">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M19.1001 19.16C19.6901 18.26 19.9101 17.8 20.3601 16.79C17.0401 15.53 16.5101 10.8 19.7901 8.98999C18.7901 7.72999 17.3801 7 16.0501 7C15.0901 7 14.4301 7.25001 13.8401 7.48001C13.3401 7.67001 12.8901 7.84 12.3301 7.84C11.7301 7.84 11.2001 7.65001 10.6401 7.45001C10.0301 7.23001 9.39006 7 8.59006 7C7.10006 7 5.51007 7.91 4.50007 9.47C3.08007 11.67 3.33007 15.79 5.62007 19.31C6.44007 20.57 7.54007 21.98 8.97007 22C9.57007 22.01 9.96007 21.83 10.3901 21.64C10.8801 21.42 11.4101 21.18 12.3401 21.18C13.2701 21.17 13.7901 21.42 14.2801 21.64C14.7001 21.83 15.0801 22.01 15.6701 22C17.1201 21.98 18.2801 20.42 19.1001 19.16Z"
        fill="currentColor"
        style={{ fill: "var(--fillg, currentColor)" }}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M15.8399 2C15.9999 3.1 15.5499 4.19001 14.9599 4.95001C14.3299 5.77001 13.2299 6.41 12.1699 6.37C11.9799 5.31 12.4699 4.21999 13.0699 3.48999C13.7399 2.68999 14.8699 2.07 15.8399 2Z"
        fill="currentColor"
        style={{ fill: "var(--fillg, currentColor)" }}
      />
    </g>
    <defs>
      <clipPath id="clip0_4418_8987">
        <rect width="24" height="24" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

export const LightModeIcon: React.FC<IconProps> = ({ size = 20, className = "", style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    style={{ ...style, fill: "var(--fillg, currentColor)" }}
    {...props}
  >
    <g clipPath="url(#clip0_4418_7943)">
      <path
        d="M12 19C15.866 19 19 15.866 19 12C19 8.13401 15.866 5 12 5C8.13401 5 5 8.13401 5 12C5 15.866 8.13401 19 12 19Z"
        fill="currentColor"
        style={{ fill: "var(--fillg, currentColor)" }}
      />
      <path
        d="M12 22.96C11.45 22.96 11 22.55 11 22V21.92C11 21.37 11.45 20.92 12 20.92C12.55 20.92 13 21.37 13 21.92C13 22.47 12.55 22.96 12 22.96ZM19.14 20.14C18.88 20.14 18.63 20.04 18.43 19.85L18.3 19.72C17.91 19.33 17.91 18.7 18.3 18.31C18.69 17.92 19.32 17.92 19.71 18.31L19.84 18.44C20.23 18.83 20.23 19.46 19.84 19.85C19.65 20.04 19.4 20.14 19.14 20.14ZM4.86 20.14C4.6 20.14 4.35 20.04 4.15 19.85C3.76 19.46 3.76 18.83 4.15 18.44L4.28 18.31C4.67 17.92 5.3 17.92 5.69 18.31C6.08 18.7 6.08 19.33 5.69 19.72L5.56 19.85C5.37 20.04 5.11 20.14 4.86 20.14ZM22 13H21.92C21.37 13 20.92 12.55 20.92 12C20.92 11.45 21.37 11 21.92 11C22.47 11 22.96 11.45 22.96 12C22.96 12.55 22.55 13 22 13ZM2.08 13H2C1.45 13 1 12.55 1 12C1 11.45 1.45 11 2 11C2.55 11 3.04 11.45 3.04 12C3.04 12.55 2.63 13 2.08 13ZM19.01 5.99C18.75 5.99 18.5 5.89 18.3 5.7C17.91 5.31 17.91 4.68 18.3 4.29L18.43 4.16C18.82 3.77 19.45 3.77 19.84 4.16C20.23 4.55 20.23 5.18 19.84 5.57L19.71 5.7C19.52 5.89 19.27 5.99 19.01 5.99ZM4.99 5.99C4.73 5.99 4.48 5.89 4.28 5.7L4.15 5.56C3.76 5.17 3.76 4.54 4.15 4.15C4.54 3.76 5.17 3.76 5.56 4.15L5.69 4.28C6.08 4.67 6.08 5.3 5.69 5.69C5.5 5.89 5.24 5.99 4.99 5.99ZM12 3.04C11.45 3.04 11 2.63 11 2.08V2C11 1.45 11.45 1 12 1C12.55 1 13 1.45 13 2C13 2.55 12.55 3.04 12 3.04Z"
        fill="currentColor"
        style={{ fill: "var(--fillg, currentColor)" }}
      />
    </g>
    <defs>
      <clipPath id="clip0_4418_7943">
        <rect width="24" height="24" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

export const DarkModeIcon: React.FC<IconProps> = ({ size = 20, className = "", style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    style={{ ...style, fill: "var(--fillg, currentColor)" }}
    {...props}
  >
    <g clipPath="url(#clip0_4418_7940)">
      <path
        d="M21.53 15.9304C21.37 15.6604 20.92 15.2404 19.8 15.4404C19.18 15.5504 18.55 15.6004 17.92 15.5704C15.59 15.4704 13.48 14.4004 12.01 12.7504C10.71 11.3004 9.90995 9.41036 9.89995 7.37036C9.89995 6.23036 10.12 5.13036 10.57 4.09036C11.01 3.08036 10.7 2.55036 10.48 2.33036C10.25 2.10036 9.70995 1.78036 8.64995 2.22036C4.55995 3.94036 2.02995 8.04036 2.32995 12.4304C2.62995 16.5604 5.52995 20.0904 9.36995 21.4204C10.29 21.7404 11.26 21.9304 12.26 21.9704C12.42 21.9804 12.58 21.9904 12.74 21.9904C16.09 21.9904 19.23 20.4104 21.21 17.7204C21.88 16.7904 21.7 16.2004 21.53 15.9304Z"
        fill="currentColor"
        style={{ fill: "var(--fillg, currentColor)" }}
      />
    </g>
    <defs>
      <clipPath id="clip0_4418_7940">
        <rect width="24" height="24" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

export const SystemModeIcon: React.FC<IconProps> = ({ size = 20, className = "", style, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    style={{ ...style, fill: "var(--fillg, currentColor)" }}
    {...props}
  >
    <g clipPath="url(#clip0_4418_8810)">
      <path
        d="M17.56 2H6.41C3.98 2 2 3.98 2 6.41V12.91V13.11C2 15.55 3.98 17.52 6.41 17.52H10.25C10.8 17.52 11.25 17.97 11.25 18.52V19.49C11.25 20.04 10.8 20.49 10.25 20.49H7.83C7.42 20.49 7.08 20.83 7.08 21.24C7.08 21.65 7.41 22 7.83 22H16.18C16.59 22 16.93 21.66 16.93 21.25C16.93 20.84 16.59 20.5 16.18 20.5H13.76C13.21 20.5 12.76 20.05 12.76 19.5V18.53C12.76 17.98 13.21 17.53 13.76 17.53H17.57C20.01 17.53 21.98 15.55 21.98 13.12V12.92V6.42C21.97 3.98 19.99 2 17.56 2Z"
        fill="currentColor"
        style={{ fill: "var(--fillg, currentColor)" }}
      />
    </g>
    <defs>
      <clipPath id="clip0_4418_8810">
        <rect width="24" height="24" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

export const EyeIcon: React.FC<IconProps> = ({ size = 18, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const EyeOffIcon: React.FC<IconProps> = ({ size = 18, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
    <line x1="2" x2="22" y1="2" y2="22" />
  </svg>
);

export const CheckIcon: React.FC<IconProps> = ({ size = 16, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export const SpinnerIcon: React.FC<IconProps> = ({ size = 18, className = "", ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`animate-spin ${className}`}
    {...props}
  >
    <line x1="12" y1="2" x2="12" y2="6" />
    <line x1="12" y1="18" x2="12" y2="22" />
    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
    <line x1="2" y1="12" x2="6" y2="12" />
    <line x1="18" y1="12" x2="22" y2="12" />
    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
  </svg>
);

export const AlertCircleIcon: React.FC<IconProps> = ({ size = 18, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

export const CloseIcon: React.FC<IconProps> = ({ size = 18, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
