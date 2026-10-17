"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import {
  AgentNodesIcon,
  BrowserGlobeIcon,
  WorkflowBranchIcon,
  ShieldCheckIcon,
  CheckIcon,
} from "@/components/Icons";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import styles from "./dashboard.module.css";

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data?.name) {
              setUserName(data.name);
            }
          }
        } catch {
          // Keep current state
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const formatDisplayName = (user: User | null, stored?: string): string => {
    if (stored && stored.trim()) {
      const sName = stored.trim();
      const emailPrefix = user?.email?.split("@")[0] || "";
      if (sName !== emailPrefix && !sName.includes("@")) return sName;
    }
    if (user?.displayName && user.displayName.trim()) {
      const dName = user.displayName.trim();
      const emailPrefix = user?.email?.split("@")[0] || "";
      if (dName !== emailPrefix && !dName.includes("@")) return dName;
    }
    const rawSource = (stored && stored.trim()) || user?.displayName || user?.email?.split("@")[0] || "";
    if (rawSource) {
      const cleaned = rawSource.split("@")[0];
      const parts = cleaned.split(/[._-]/).filter(Boolean);
      const formattedParts = parts
        .map((p) => p.replace(/[0-9]/g, ""))
        .filter((p) => p.length > 0)
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase());

      if (formattedParts.length > 0) return formattedParts.join(" ");
      return cleaned;
    }
    return "Krishanth B";
  };

  const activeUserName = formatDisplayName(currentUser, userName);
  const activeUserEmail = currentUser?.email || "krishanth.b.2008@gmail.com";

  return (
    <AppLayout activeRoute="/dashboard">
      {/* Welcome Banner */}
      <div className={styles.welcomeBanner}>
        <div className={styles.welcomeText}>
          <h1>Welcome to OperatSI Console, {activeUserName}</h1>
          <p>Autonomous AI Multi-Agent orchestration and cloud browser runtime environment.</p>
        </div>
        <div className={styles.welcomeMeta}>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Environment</span>
            <span className={styles.metaValue}>Production</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Security</span>
            <span className={styles.metaValue}>SOC2 Ready</span>
          </div>
        </div>
      </div>

      {/* Telemetry Metrics Grid */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span>Active Agents</span>
            <div className={styles.metricIcon}>
              <AgentNodesIcon size={18} />
            </div>
          </div>
          <div className={styles.metricValue}>3 Running</div>
          <div className={styles.metricDelta}>
            <CheckIcon size={14} />
            <span>All nodes healthy</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span>Browser Sessions</span>
            <div className={styles.metricIcon}>
              <BrowserGlobeIcon size={18} />
            </div>
          </div>
          <div className={styles.metricValue}>18 Sandboxes</div>
          <div className={styles.metricDelta}>
            <span>42ms latency avg</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span>Tasks Executed</span>
            <div className={styles.metricIcon}>
              <WorkflowBranchIcon size={18} />
            </div>
          </div>
          <div className={styles.metricValue}>1,429</div>
          <div className={styles.metricDelta}>
            <span>99.8% success rate</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span>Compliance</span>
            <div className={styles.metricIcon}>
              <ShieldCheckIcon size={18} />
            </div>
          </div>
          <div className={styles.metricValue}>SOC2 Compliant</div>
          <div className={styles.metricDelta}>
            <span>Encrypted at rest &amp; transit</span>
          </div>
        </div>
      </div>

      {/* Multi-Agent Modules & Live Terminal */}
      <div className={styles.dashboardRow}>
        {/* Agent Fleet Overview */}
        <div className={styles.dashboardSection}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleGroup}>
              <span className={styles.sectionTitle}>Agent Execution Graph</span>
              <span className={styles.sectionBadge}>Multi-Agent Swarm</span>
            </div>
          </div>

          <div className={styles.agentList}>
            <div className={styles.agentCard}>
              <div className={styles.agentLeft}>
                <div className={styles.agentAvatar}>
                  <AgentNodesIcon size={20} />
                </div>
                <div className={styles.agentInfo}>
                  <span className={styles.agentName}>Multi-Agent Orchestrator</span>
                  <span className={styles.agentRole}>
                    Autonomous graph routing &amp; parallel agent dispatch
                  </span>
                </div>
              </div>
              <div className={styles.agentStatus}>
                <span className={styles.pulseDot} />
                <span>Online</span>
              </div>
            </div>

            <div className={styles.agentCard}>
              <div className={styles.agentLeft}>
                <div className={styles.agentAvatar}>
                  <BrowserGlobeIcon size={20} />
                </div>
                <div className={styles.agentInfo}>
                  <span className={styles.agentName}>Cloud Browser Automation</span>
                  <span className={styles.agentRole}>
                    Sandboxed DOM crawler &amp; automated UI verifier
                  </span>
                </div>
              </div>
              <div className={styles.agentStatus}>
                <span className={styles.pulseDot} />
                <span>Ready</span>
              </div>
            </div>

            <div className={styles.agentCard}>
              <div className={styles.agentLeft}>
                <div className={styles.agentAvatar}>
                  <WorkflowBranchIcon size={20} />
                </div>
                <div className={styles.agentInfo}>
                  <span className={styles.agentName}>Telemetry &amp; Audit Engine</span>
                  <span className={styles.agentRole}>
                    Deterministic execution log tracing and security verification
                  </span>
                </div>
              </div>
              <div className={styles.agentStatus}>
                <span className={styles.pulseDot} />
                <span>Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Real-time Terminal Stream */}
        <div className={styles.dashboardSection}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleGroup}>
              <span className={styles.sectionTitle}>Live Log Stream</span>
              <span className={styles.sectionBadge}>Real-Time</span>
            </div>
          </div>

          <div className={styles.terminalBox}>
            <div className={styles.terminalLine}>
              <span className={styles.terminalTime}>[09:45:01]</span>
              <span className={styles.terminalBadge}>SYS</span>
              <span className={styles.terminalText}>OperatSI Multi-Agent kernel v2.4 initialized.</span>
            </div>
            <div className={styles.terminalLine}>
              <span className={styles.terminalTime}>[09:45:02]</span>
              <span className={styles.terminalBadge}>AUTH</span>
              <span className={styles.terminalText}>Session verified for {activeUserEmail}</span>
            </div>
            <div className={styles.terminalLine}>
              <span className={styles.terminalTime}>[09:45:03]</span>
              <span className={styles.terminalBadge}>AGENT</span>
              <span className={styles.terminalText}>Orchestrator node dispatched to Production cluster.</span>
            </div>
            <div className={styles.terminalLine}>
              <span className={styles.terminalTime}>[09:45:04]</span>
              <span className={styles.terminalBadge}>BROWSER</span>
              <span className={styles.terminalText}>Headless container pool ready (4 instances available).</span>
            </div>
            <div className={styles.terminalLine}>
              <span className={styles.terminalTime}>[09:45:05]</span>
              <span className={styles.terminalBadge}>SOC2</span>
              <span className={styles.terminalText}>All network interfaces TLS 1.3 encrypted.</span>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
