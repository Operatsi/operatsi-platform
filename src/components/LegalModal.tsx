"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { CloseIcon } from "./Icons";
import styles from "./LegalModal.module.css";

export type LegalDocType = "terms" | "privacy" | "help" | null;

interface LegalModalProps {
  type: LegalDocType;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ type, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (type) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [type, onClose]);

  if (!type) return null;

  const contentMap: Record<string, { title: string; subtitle: string; body: React.ReactNode }> = {
    terms: {
      title: "Terms of Service",
      subtitle: "OperatSI Platform Usage & Legal Agreement",
      body: (
        <div className={styles.contentBody}>
          <h4>1. Acceptance of Terms</h4>
          <p>
            By accessing or using the OperatSI platform developed by OVIC Labs, you agree to be bound by these
            Terms of Service. Our platform provides autonomous multi-agent orchestration, intelligent planning,
            and cloud browser automation.
          </p>
          <h4>2. Account & Security</h4>
          <p>
            You are responsible for maintaining the confidentiality of your authentication credentials and for all
            activities conducted through your workspace. You agree to notify us immediately of any unauthorized use.
          </p>
          <h4>3. Acceptable Use</h4>
          <p>
            You must not use our automated agents or workflow engines to perform unauthorized network penetration,
            data scraping that violates third-party terms, or any unlawful computational tasks.
          </p>
          <h4>4. Intellectual Property</h4>
          <p>
            All custom workflows, business logic, and proprietary models configured in your workspace remain your
            exclusive property. OperatSI infrastructure and foundational agent technologies are protected by copyright.
          </p>
        </div>
      ),
    },
    privacy: {
      title: "Privacy Policy",
      subtitle: "How OperatSI protects and handles your business telemetry",
      body: (
        <div className={styles.contentBody}>
          <h4>1. Information We Collect</h4>
          <p>
            We collect account profile details (email, name), workspace configuration metrics, and execution logs
            strictly necessary to execute your multi-agent workflows and cloud browser automations.
          </p>
          <h4>2. Telemetry & Security</h4>
          <p>
            All data in transit is encrypted using TLS 1.3, and data at rest is protected with AES-256 encryption. We
            never sell or share your business data with third-party advertisers.
          </p>
          <h4>3. Third-Party Integrations</h4>
          <p>
            When you connect external providers like Google or Apple, authentication tokens are managed securely
            via Firebase Authentication and are never stored in plain text.
          </p>
          <h4>4. Data Retention</h4>
          <p>
            You retain the right to export or permanently purge your workspace logs and operational history at any
            time through the workspace settings.
          </p>
        </div>
      ),
    },
    help: {
      title: "Help Center",
      subtitle: "Support & Troubleshooting for OperatSI Platform",
      body: (
        <div className={styles.contentBody}>
          <h4>Getting Started</h4>
          <p>
            OperatSI is designed for founders, engineering teams, and enterprises to orchestrate workflows
            autonomously. You can sign in using your work email or one-click OAuth providers.
          </p>
          <h4>Frequently Asked Questions</h4>
          <div className={styles.faqItem}>
            <strong>How do I reset my credentials?</strong>
            <p>Click &quot;Forgot password?&quot; on the login screen to receive a secure recovery link.</p>
          </div>
          <div className={styles.faqItem}>
            <strong>Need organization access or SSO?</strong>
            <p>
              Contact your organization administrator to receive an invite token or configure enterprise SAML/OAuth.
            </p>
          </div>
          <h4>Contact Support</h4>
          <p>
            Reach our engineering support desk at <code>support@operatsi.com</code> or submit a ticket on our
            official GitHub repository.
          </p>
        </div>
      ),
    },
  };

  const current = contentMap[type];

  return (
    <div className={styles.backdrop} onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div>
            <h3 id="modal-title" className={styles.modalTitle}>
              {current.title}
            </h3>
            <p className={styles.modalSubtitle}>{current.subtitle}</p>
          </div>
          <button id="btn-close-legal-modal" className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            <CloseIcon size={20} />
          </button>
        </div>
        <div className={styles.modalScroll}>{current.body}</div>
        <div className={styles.modalFooter}>
          {type === "terms" ? (
            <Link href="/terms" className={styles.fullPageLink} onClick={onClose}>
              Open Full Document (25 Sections) ↗
            </Link>
          ) : (
            <div />
          )}
          <button id="btn-modal-dismiss" className={styles.dismissBtn} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
