"use client";

import React, { useState, useRef, useEffect } from "react";
import { CheckIcon, ChevronDownIcon, SearchIcon } from "./Icons";
import styles from "./CustomSelect.module.css";

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  badge?: string;
  icon?: React.ReactNode;
}

export interface CustomSelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  searchable?: boolean;
  align?: "left" | "right";
  style?: React.CSSProperties;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  id,
  value,
  onChange,
  options,
  placeholder = "Select an option...",
  disabled = false,
  className = "",
  searchable,
  align = "left",
  style,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Auto-enable search if there are 6 or more items
  const shouldEnableSearch = searchable !== undefined ? searchable : options.length >= 6;

  // Selected option
  const selectedOption = options.find((opt) => opt.value === value);

  // Filtered options based on search query
  const filteredOptions = options.filter(
    (opt) =>
      opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (opt.description && opt.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (opt.badge && opt.badge.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && shouldEnableSearch && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, shouldEnableSearch]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === "Escape") {
      setIsOpen(false);
    } else if (e.key === "Enter" || e.key === " ") {
      if (!isOpen) {
        e.preventDefault();
        setIsOpen(true);
      }
    }
  };

  const handleSelectOption = (optValue: string) => {
    onChange(optValue);
    setIsOpen(false);
    setSearchQuery("");
  };

  return (
    <div
      ref={containerRef}
      className={`${styles.selectWrapper} ${className}`}
      style={style}
      onKeyDown={handleKeyDown}
    >
      {/* Trigger Button */}
      <button
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-disabled={disabled}
        disabled={disabled}
        className={`${styles.triggerBtn} ${isOpen ? styles.triggerOpen : ""}`}
        onClick={() => {
          if (!disabled) {
            setIsOpen((prev) => !prev);
            setSearchQuery("");
          }
        }}
      >
        <div className={styles.triggerContent}>
          {selectedOption ? (
            <>
              {selectedOption.icon && <span>{selectedOption.icon}</span>}
              <span className={styles.triggerLabel}>{selectedOption.label}</span>
              {selectedOption.badge && (
                <span className={styles.triggerBadge}>{selectedOption.badge}</span>
              )}
            </>
          ) : (
            <span style={{ color: "var(--text-muted)" }}>{placeholder}</span>
          )}
        </div>

        <div className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ""}`}>
          <ChevronDownIcon size={14} />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`${styles.dropdownMenu} ${align === "right" ? styles.dropdownMenuRight : ""}`}
          role="listbox"
          aria-labelledby={id}
        >
          {/* Optional Search */}
          {shouldEnableSearch && (
            <div className={styles.searchBox}>
              <SearchIcon size={13} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}

          {/* Options */}
          <ul className={styles.optionsList}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <li key={opt.value}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      className={`${styles.optionItem} ${isSelected ? styles.optionSelected : ""}`}
                      onClick={() => handleSelectOption(opt.value)}
                    >
                      <div className={styles.optionContent}>
                        <div className={styles.optionHeader}>
                          {opt.icon && <span>{opt.icon}</span>}
                          <span className={styles.optionLabel}>{opt.label}</span>
                          {opt.badge && <span className={styles.optionBadge}>{opt.badge}</span>}
                        </div>
                        {opt.description && (
                          <span className={styles.optionDesc}>{opt.description}</span>
                        )}
                      </div>

                      {isSelected && (
                        <div className={styles.checkIcon}>
                          <CheckIcon size={14} />
                        </div>
                      )}
                    </button>
                  </li>
                );
              })
            ) : (
              <li className={styles.noResults}>No matching options found</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
