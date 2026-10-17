"use client";

import React, { useState } from "react";
import { MenuItem } from "../lib/navigation";
import { CheckIcon, SpinnerIcon } from "./Icons";
import styles from "./ComingSoonView.module.css";

interface ComingSoonViewProps {
  item: MenuItem;
}

export const ComingSoonView: React.FC<ComingSoonViewProps> = ({ item }) => {
  const [activeTab, setActiveTab] = useState<string>(item.submenus?.[0] || "Overview");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 700);
  };

  return (
    <div className={styles.comingSoonContainer}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.titleRow}>
          <div className={styles.titleGroup}>
            <h1 className={styles.pageTitle}>{item.label}</h1>
            <p className={styles.pageDescription}>{item.description}</p>
          </div>
        </div>

        {/* Submenu Tabs (if any) */}
        {item.submenus && item.submenus.length > 0 && (
          <div className={styles.submenuTabs} role="tablist">
            {item.submenus.map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={activeTab === tab}
                className={`${styles.tabBtn} ${activeTab === tab ? styles.tabBtnActive : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Futuristic Coming Soon Hero */}
      <div className={styles.heroCard}>
        <div className={styles.heroBadge}>
          <span>⚡ Under Active Development • Coming Soon</span>
        </div>

        <h2 className={styles.heroTitle}>{item.label} is Launching Soon</h2>
        <p className={styles.heroSubtitle}>
          We are engineering the high-performance {item.label.toLowerCase()} architecture with
          enterprise-grade reliability, real-time sync, and autonomous agent integration.
        </p>

        {/* Notify Me Form */}
        {isSuccess ? (
          <div className={styles.notifySuccess}>
            <CheckIcon size={16} />
            <span>Thank you! We will notify you as soon as {item.label} opens for early access.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.notifyForm}>
            <input
              type="email"
              placeholder="Enter work email for early access..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={styles.notifyInput}
            />
            <button type="submit" disabled={isSubmitting} className={styles.notifyBtn}>
              {isSubmitting ? <SpinnerIcon size={14} /> : "Notify Me"}
            </button>
          </form>
        )}

        <div className={styles.metaStatusRow}>
          <div className={styles.metaStatusItem}>
            <span>Status:</span>
            <strong>Private Alpha</strong>
          </div>
          <div className={styles.metaStatusItem}>
            <span>Target:</span>
            <strong>Q2 2026</strong>
          </div>
          <div className={styles.metaStatusItem}>
            <span>Audit:</span>
            <strong>SOC2 Ready</strong>
          </div>
        </div>
      </div>

      {/* Feature Preview Cards Grid based on Submenus or Defaults */}
      <div className={styles.previewGrid}>
        {(item.submenus && item.submenus.length > 0
          ? item.submenus
          : ["Automated Engine", "Telemetry Sync", "Enterprise Security"]
        ).map((sub, index) => (
          <div key={sub} className={styles.previewCard}>
            <div className={styles.previewCardHeader}>
              <span className={styles.previewCardTitle}>{sub}</span>
              <span className={styles.previewCardStatus}>Planned</span>
            </div>
            <p className={styles.previewCardDesc}>
              Full end-to-end integration with OperatSI autonomous multi-agent pipelines, providing
              zero-latency execution and continuous audit tracing.
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
