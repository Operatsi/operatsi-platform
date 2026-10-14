"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";
import { CheckIcon } from "./Icons";
import styles from "./DeviceSupportGate.module.css";

export const DeviceSupportGate: React.FC = () => {
  const pathname = usePathname();
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });
  const [isMobileOrTablet, setIsMobileOrTablet] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [bypassed, setBypassed] = useState<boolean>(false);

  const [currentUrl, setCurrentUrl] = useState<string>("https://operatsi.com");

  const isLegalPage =
    pathname?.startsWith("/terms") ||
    pathname?.startsWith("/privacy") ||
    pathname?.startsWith("/terms-of-service") ||
    pathname?.startsWith("/privacy-policy");

  useEffect(() => {
    setCurrentUrl(window.location.href);

    const checkDevice = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setDimensions({ width: w, height: h });

      const ua = navigator.userAgent || "";
      const isMobileUA =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Tablet|Silk/i.test(ua);
      const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
      const isNarrow = w <= 1024;
      const isTouchTablet = isCoarsePointer && w <= 1280;

      setIsMobileOrTablet(isMobileUA || isNarrow || isTouchTablet);
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);
    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  const handleCopyLink = async () => {
    try {
      const url = typeof window !== "undefined" ? window.location.href : currentUrl;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = url;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3000);
    } catch {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3000);
    }
  };

  const mailtoUrl = `mailto:?subject=${encodeURIComponent(
    "OperatSI — Business Operating Platform (Desktop Link)"
  )}&body=${encodeURIComponent(
    "Open OperatSI on your desktop or laptop browser to access multi-agent workflows:\n\n" +
      currentUrl
  )}`;

  return (
    <aside
      className={`${styles.gateOverlay} ${bypassed ? styles.bypassed : ""}`}
      id="device-support-gate"
      aria-label="Device Support Notice"
      role="dialog"
      aria-modal="true"
    >
      <div className={styles.gateContainer}>
        {/* Header with Brand & Theme Toggle */}
        <div className={styles.gateHeader}>
          <div className={styles.brandGroup}>
            <Image
              src="/OperatSI.png"
              alt="OperatSI Logo"
              width={32}
              height={32}
              className={styles.logoImage}
              priority
            />
            <div className={styles.brandText}>
              <span className={styles.brandTitle}>OperatSI</span>
              <span className={styles.brandSubtitle}>An OVIC Labs Company</span>
            </div>
          </div>
          <ThemeToggle />
        </div>

        {/* Device Graphic Illustration */}
        <div className={styles.illustrationWrapper}>
          <svg
            className={styles.deviceGraphic}
            viewBox="0 0 320 160"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            {/* Monitor Base & Stand */}
            <rect x="135" y="132" width="50" height="10" rx="3" fill="var(--card-border)" />
            <path d="M150 115 H170 V132 H150 Z" fill="var(--card-border)" />

            {/* Desktop Screen Body */}
            <rect
              x="50"
              y="12"
              width="220"
              height="105"
              rx="9"
              fill="var(--input-bg)"
              stroke="var(--card-border)"
              strokeWidth="2"
            />
            {/* Screen Inner Display */}
            <rect x="58" y="20" width="204" height="89" rx="5" fill="var(--card-bg)" />

            {/* Desktop UI Elements (Windows, Agent Cards, Waveform) */}
            <rect x="66" y="27" width="55" height="12" rx="3" fill="rgba(37, 99, 235, 0.25)" />
            <rect x="66" y="44" width="70" height="6" rx="2" fill="var(--card-border)" />
            <rect x="66" y="54" width="50" height="6" rx="2" fill="var(--card-border)" />

            <rect x="150" y="27" width="102" height="74" rx="4" fill="var(--input-bg)" />
            <rect x="158" y="34" width="86" height="5" rx="2" fill="rgba(37, 99, 235, 0.4)" />
            <rect x="158" y="43" width="72" height="4" rx="2" fill="var(--card-border)" />
            <rect x="158" y="51" width="78" height="4" rx="2" fill="var(--card-border)" />
            <rect x="158" y="59" width="60" height="4" rx="2" fill="var(--card-border)" />

            {/* Supported Desktop Check Badge */}
            <circle cx="258" cy="24" r="12" fill="#16a34a" />
            <path
              d="M252 24 L256 28 L264 20"
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Mobile / Tablet Device (Front Overlay with Not Supported Badge) */}
            <rect
              x="20"
              y="60"
              width="48"
              height="80"
              rx="7"
              fill="var(--input-bg)"
              stroke="var(--card-border)"
              strokeWidth="2"
            />
            <rect x="24" y="66" width="40" height="68" rx="4" fill="var(--card-bg)" />
            <rect x="34" y="62" width="20" height="2.5" rx="1" fill="var(--card-border)" />
            <circle cx="44" cy="130" r="2.5" fill="var(--card-border)" />

            {/* Red Restriction Cross Badge on Phone */}
            <circle cx="56" cy="68" r="11" fill="#dc2626" />
            <path
              d="M51 63 L61 73 M61 63 L51 73"
              stroke="#ffffff"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Warning Pill */}
        <div className={styles.statusBadgeWrapper}>
          <div className={styles.statusBadge}>
            <span className={styles.pulseDot} />
            Mobile &amp; Tablet Devices Not Supported
          </div>
        </div>

        {/* Content Section */}
        <div className={styles.contentSection}>
          <h1 className={styles.title}>Desktop Experience Required</h1>
          <p className={styles.description}>
            OperatSI is built exclusively for desktop and laptop environments. Our multi-agent
            orchestration canvas, cloud browser automation, and high-density productivity tools
            require a full desktop viewport and precision input.
          </p>
        </div>

        {/* Telemetry Box */}
        <div className={styles.telemetryBox}>
          <div className={styles.telemetryItem}>
            <span className={styles.telemetryLabel}>Detected Viewport</span>
            <span className={styles.telemetryValue}>
              {dimensions.width > 0 ? `${dimensions.width} × ${dimensions.height} px` : "Mobile / Tablet"}
            </span>
          </div>
          <div className={styles.telemetryDivider} />
          <div className={styles.telemetryItem}>
            <span className={styles.telemetryLabel}>Minimum Requirement</span>
            <span className={styles.telemetryValue}>1024 px (Desktop / Laptop)</span>
          </div>
        </div>

        {/* Capability Reasons */}
        <div className={styles.featuresGrid}>
          <div className={styles.featureItem}>
            <div className={styles.featureIcon}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect width="20" height="14" x="2" y="3" rx="2" />
                <line x1="8" x2="16" y1="21" y2="21" />
                <line x1="12" x2="12" y1="17" y2="21" />
              </svg>
            </div>
            <div className={styles.featureText}>
              <span className={styles.featureTitle}>Multi-Agent Visual Canvas</span>
              <span className={styles.featureDesc}>
                Parallel agent execution graphs and terminal streaming require desktop display space.
              </span>
            </div>
          </div>

          <div className={styles.featureItem}>
            <div className={styles.featureIcon}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                <path d="M2 12h20" />
              </svg>
            </div>
            <div className={styles.featureText}>
              <span className={styles.featureTitle}>Cloud Browser Automation</span>
              <span className={styles.featureDesc}>
                Direct browser sandboxes require hardware mouse events and desktop windowing.
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className={styles.actionGroup}>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={handleCopyLink}
            id="btn-copy-desktop-link"
          >
            {isCopied ? (
              <>
                <CheckIcon size={18} />
                <span>Link Copied! Open on Your PC or Mac</span>
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                </svg>
                <span>Copy Platform Link for Desktop</span>
              </>
            )}
          </button>

          <a href={mailtoUrl} className={styles.btnSecondary} id="btn-email-desktop-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
            <span>Email Link to Myself</span>
          </a>
        </div>

        {/* Legal Document Read-Only Bypass Option */}
        {isLegalPage && (
          <div className={styles.legalBypassSection}>
            <p className={styles.legalBypassText}>
              You are currently viewing an official legal compliance document.
            </p>
            <button
              type="button"
              className={styles.btnBypass}
              onClick={() => setBypassed(true)}
              id="btn-bypass-legal-mobile"
            >
              Continue reading document in mobile view (Read-Only) ↓
            </button>
          </div>
        )}

        {/* Footer */}
        <div className={styles.gateFooter}>
          <nav className={styles.footerNav} aria-label="Quick Links">
            <Link href="/terms" className={styles.footerLink}>
              Terms of Service
            </Link>
            <span className={styles.footerDot}>•</span>
            <Link href="/privacy" className={styles.footerLink}>
              Privacy Policy
            </Link>
            <span className={styles.footerDot}>•</span>
            <a href="mailto:support@operatsi.com" className={styles.footerLink}>
              Contact Support
            </a>
          </nav>
          <span className={styles.copyright}>
            © 2026 OperatSI. All rights reserved. An OVIC Labs Company.
          </span>
        </div>
      </div>
    </aside>
  );
};
