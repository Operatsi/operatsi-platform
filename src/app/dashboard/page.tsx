"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "../../components/ThemeToggle";
import {
  SettingsHexIcon,
  DashboardGridIcon,
  AgentNodesIcon,
  BrowserGlobeIcon,
  WorkflowBranchIcon,
  TerminalLogsIcon,
  BellIcon,
  SearchIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MenuToggleIcon,
  LogoutIcon,
  CheckIcon,
  ShieldCheckIcon,
} from "../../components/Icons";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import styles from "./dashboard.module.css";

type DashboardTab = "overview" | "agents" | "automations" | "workflows" | "logs" | "settings";

export default function DashboardPage() {
  const router = useRouter();

  // Sidebar Open/Closed State (User requirement: when closed, show only icon; when open, show icon and text)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");

  // Auth User details
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  // Resolves the User's display name: stored name -> displayName -> formatted name from email
  const formatDisplayName = (user: User | null, stored?: string): string => {
    if (stored && stored.trim()) {
      const sName = stored.trim();
      const emailPrefix = user?.email?.split("@")[0] || "";
      if (sName !== emailPrefix && !sName.includes("@")) {
        return sName;
      }
    }
    if (user?.displayName && user.displayName.trim()) {
      const dName = user.displayName.trim();
      const emailPrefix = user?.email?.split("@")[0] || "";
      if (dName !== emailPrefix && !dName.includes("@")) {
        return dName;
      }
    }
    const rawSource = (stored && stored.trim()) || user?.displayName || user?.email?.split("@")[0] || "";
    if (rawSource) {
      const cleaned = rawSource.split("@")[0];
      const parts = cleaned.split(/[._-]/).filter(Boolean);
      const formattedParts = parts
        .map((p) => p.replace(/[0-9]/g, ""))
        .filter((p) => p.length > 0)
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase());

      if (formattedParts.length > 0) {
        return formattedParts.join(" ");
      }
      return cleaned;
    }
    return "Krishanth B";
  };

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
          // Keep current user state
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const activeUserName = formatDisplayName(currentUser, userName);
  const activeUserEmail = currentUser?.email || "krishanth.b.2008@gmail.com";
  const userInitial = (activeUserName?.[0] || activeUserEmail?.[0] || "O").toUpperCase();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch {
      // Continue navigation
    }
    router.push("/");
  };

interface NavItem {
  id: DashboardTab;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

  // Sidebar navigation menu items
  const navItems: NavItem[] = [
    { id: "overview", label: "Overview", icon: <DashboardGridIcon size={20} /> },
    { id: "agents", label: "Agent Graph", icon: <AgentNodesIcon size={20} />, badge: "3 Active" },
    { id: "automations", label: "Browser Automations", icon: <BrowserGlobeIcon size={20} />, badge: "Ready" },
    { id: "workflows", label: "Workflows & DAGs", icon: <WorkflowBranchIcon size={20} /> },
    { id: "logs", label: "Telemetry & Logs", icon: <TerminalLogsIcon size={20} /> },
  ];

  return (
    <div className={styles.dashboardContainer}>
      {/* =========================================================
          1. LEFT MENU (SIDEBAR)
          Toggleable: Open (icon + text) vs Closed (only icon)
          Bottom: Settings item with user's exact SVG icon
          ========================================================= */}
      <aside
        className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : styles.sidebarClosed} ${
          isMobileOpen ? styles.sidebarMobileOpen : ""
        }`}
        aria-label="Sidebar Navigation"
      >
        {/* Sidebar Brand & Collapse Toggle */}
        <div className={styles.sidebarHeader}>
          <Link href="/dashboard" className={styles.brandLink}>
            <div className={styles.brandLogoWrapper}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                  fill="#ffffff"
                />
              </svg>
            </div>
            {isSidebarOpen && (
              <div className={styles.brandText}>
                <span className={styles.brandTitle}>OperatSI</span>
                <span className={styles.brandBadge}>AI Enterprise</span>
              </div>
            )}
          </Link>

          {/* Toggle Button: closes or opens the Left Menu */}
          <button
            type="button"
            className={styles.toggleSidebarBtn}
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            aria-label={isSidebarOpen ? "Collapse sidebar menu" : "Expand sidebar menu"}
            title={isSidebarOpen ? "Collapse menu" : "Expand menu"}
          >
            {isSidebarOpen ? <ChevronLeftIcon size={16} /> : <ChevronRightIcon size={16} />}
          </button>
        </div>

        {/* Sidebar Nav Items */}
        <nav className={styles.sidebarNav}>
          {isSidebarOpen && <div className={styles.sidebarSectionTitle}>Platform Modules</div>}

          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileOpen(false);
                }}
                title={!isSidebarOpen ? item.label : undefined}
                aria-label={item.label}
              >
                <div className={styles.navItemIcon}>{item.icon}</div>
                {isSidebarOpen && (
                  <>
                    <span className={styles.navItemLabel}>{item.label}</span>
                    {item.badge && <span className={styles.navItemBadge}>{item.badge}</span>}
                  </>
                )}
              </button>
            );
          })}
        </nav>

        {/* =========================================================
            SIDEBAR BOTTOM:
            Settings with EXACT user-provided SVG icon!
            - When Left Menu is Close: Show Only the icon
            - When Left Menu is Open: Show the icon and the Text "Settings"
            ========================================================= */}
        <div className={styles.sidebarBottom}>
          <button
            id="sidebar-settings-btn"
            type="button"
            className={`${styles.settingsItem} ${activeTab === "settings" ? styles.settingsItemActive : ""}`}
            onClick={() => {
              setActiveTab("settings");
              setIsMobileOpen(false);
            }}
            title={!isSidebarOpen ? "Settings" : undefined}
            aria-label="Settings"
          >
            <div className={styles.settingsItemIcon}>
              <SettingsHexIcon size={22} />
            </div>
            {isSidebarOpen && <span className={styles.settingsItemLabel}>Settings</span>}
          </button>

          {/* User Profile Mini Strip */}
          <div className={styles.sidebarUserCard} title={`${activeUserName} (${activeUserEmail})`}>
            <div className={styles.sidebarUserAvatar}>{userInitial}</div>
            {isSidebarOpen && (
              <div className={styles.sidebarUserInfo}>
                <span className={styles.sidebarUserName}>{activeUserName}</span>
                <span className={styles.sidebarUserEmail}>{activeUserEmail}</span>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* =========================================================
          2. MAIN WRAPPER: TOP MENU + CONTENT
          ========================================================= */}
      <div className={styles.mainWrapper}>
        {/* TOP MENU (HEADER / NAVBAR) */}
        <header className={styles.topMenu}>
          <div className={styles.topMenuLeft}>
            <button
              type="button"
              className={styles.mobileMenuBtn}
              onClick={() => setIsMobileOpen((prev) => !prev)}
              aria-label="Toggle mobile menu"
            >
              <MenuToggleIcon size={20} />
            </button>

            <div className={styles.breadcrumbGroup}>
              <span className={styles.breadcrumbRoot}>OperatSI</span>
              <span className={styles.breadcrumbSeparator}>/</span>
              <span className={styles.breadcrumbCurrent}>
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
              </span>
            </div>

            <div className={styles.statusPill}>
              <span className={styles.pulseDot} />
              <span>3 Agents Online</span>
            </div>
          </div>

          {/* Search bar */}
          <div className={styles.searchBarWrapper}>
            <SearchIcon size={16} />
            <input
              type="text"
              placeholder="Search agents, runs, workflows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            <kbd className={styles.searchKbd}>⌘K</kbd>
          </div>

          {/* Top Menu Right Actions */}
          <div className={styles.topMenuRight}>
            <button
              type="button"
              className={styles.actionButton}
              onClick={() => alert("Launching new Multi-Agent Workflow...")}
            >
              <span>+ New Agent</span>
            </button>

            <button
              type="button"
              className={styles.iconBtn}
              title="Notifications"
              aria-label="Notifications"
              onClick={() => alert("All 3 agents operating within normal bounds.")}
            >
              <BellIcon size={18} />
              <span className={styles.unreadDot} />
            </button>

            {/* Global Theme Toggle */}
            <ThemeToggle />

            {/* Top User Pill: User Name on Top, User Email below */}
            <div
              className={styles.topUserPill}
              onClick={() => setActiveTab("settings")}
              title="Click to view user settings"
            >
              <div className={styles.topUserAvatar}>{userInitial}</div>
              <div className={styles.topUserDetails}>
                <span className={styles.topUserName}>{activeUserName}</span>
                <span className={styles.topUserEmail}>{activeUserEmail}</span>
              </div>
            </div>

            <button
              type="button"
              className={styles.iconBtn}
              onClick={handleSignOut}
              title="Sign Out of Workspace"
              aria-label="Sign out"
            >
              <LogoutIcon size={18} />
            </button>
          </div>
        </header>

        {/* =========================================================
            3. MAIN CONTENT
            ========================================================= */}
        <main className={styles.mainContent}>
          {activeTab === "overview" && (
            <>
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
            </>
          )}

          {/* =========================================================
              4. SETTINGS VIEW (Opened from Left Menu Bottom Settings)
              ========================================================= */}
          {activeTab === "settings" && (
            <div className={styles.settingsView}>
              <div className={styles.settingsCard}>
                <div>
                  <h2 className={styles.settingsCardTitle}>Workspace Settings</h2>
                  <p className={styles.settingsCardSubtitle}>
                    Manage your platform console preferences, agent cluster policies, and security credentials.
                  </p>
                </div>

                <div className={styles.settingsFormRow}>
                  <div className={styles.settingsFormGroup}>
                    <label className={styles.settingsLabel}>User Display Name</label>
                    <input
                      type="text"
                      className={styles.settingsInput}
                      value={activeUserName}
                      readOnly
                    />
                  </div>
                  <div className={styles.settingsFormGroup}>
                    <label className={styles.settingsLabel}>User Email</label>
                    <input
                      type="email"
                      className={styles.settingsInput}
                      value={activeUserEmail}
                      readOnly
                    />
                  </div>
                </div>

                <div className={styles.settingsFormRow}>
                  <div className={styles.settingsFormGroup}>
                    <label className={styles.settingsLabel}>Workspace Name</label>
                    <input
                      type="text"
                      className={styles.settingsInput}
                      defaultValue="OperatSI Primary Workspace"
                    />
                  </div>
                  <div className={styles.settingsFormGroup}>
                    <label className={styles.settingsLabel}>Execution Region</label>
                    <input
                      type="text"
                      className={styles.settingsInput}
                      defaultValue="us-east-1 (Auto-scale multi-region)"
                      readOnly
                    />
                  </div>
                </div>
              </div>

              <div className={styles.settingsCard}>
                <div>
                  <h2 className={styles.settingsCardTitle}>Agent Execution Policies</h2>
                  <p className={styles.settingsCardSubtitle}>
                    Configure agent execution timeouts, maximum concurrency, and browser sandbox constraints.
                  </p>
                </div>

                <div className={styles.settingsFormRow}>
                  <div className={styles.settingsFormGroup}>
                    <label className={styles.settingsLabel}>Max Concurrent Agents</label>
                    <input
                      type="number"
                      className={styles.settingsInput}
                      defaultValue={10}
                    />
                  </div>
                  <div className={styles.settingsFormGroup}>
                    <label className={styles.settingsLabel}>Task Timeout (seconds)</label>
                    <input
                      type="number"
                      className={styles.settingsInput}
                      defaultValue={300}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Fallback view for other tabs */}
          {activeTab !== "overview" && activeTab !== "settings" && (
            <div className={styles.settingsCard}>
              <h2 className={styles.settingsCardTitle}>
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Module
              </h2>
              <p className={styles.settingsCardSubtitle}>
                Live multi-agent execution pipeline active for {activeUserName} ({activeUserEmail}).
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
