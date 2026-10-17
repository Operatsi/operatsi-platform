"use client";

import React from "react";
import { useTheme, ThemeMode } from "../context/ThemeContext";
import { LightModeIcon, DarkModeIcon, SystemModeIcon } from "./Icons";
import styles from "./ThemeToggle.module.css";

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const options: { id: ThemeMode; label: string; icon: React.ReactNode }[] = [
    {
      id: "light",
      label: "Light mode",
      icon: <LightModeIcon size={14} />,
    },
    {
      id: "system",
      label: "System preference",
      icon: <SystemModeIcon size={14} />,
    },
    {
      id: "dark",
      label: "Dark mode",
      icon: <DarkModeIcon size={14} />,
    },
  ];

  return (
    <div className={styles.segmentedControl} role="radiogroup" aria-label="Theme selection">
      {options.map((opt) => {
        const isActive = theme === opt.id;
        return (
          <button
            key={opt.id}
            id={`theme-btn-${opt.id}`}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={opt.label}
            title={opt.label}
            className={`${styles.segmentButton} ${isActive ? styles.active : ""}`}
            onClick={() => setTheme(opt.id)}
          >
            {opt.icon}
          </button>
        );
      })}
    </div>
  );
};
