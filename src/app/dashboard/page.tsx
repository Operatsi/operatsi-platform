"use client";

import React, { useState, useEffect, useRef } from "react";
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
  LockIcon,
  UserIcon,
  PhoneIcon,
  PlusIcon,
  SpinnerIcon,
  TrashIcon,
  CloseIcon,
  AlertCircleIcon,
} from "../../components/Icons";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged, signOut, User, deleteUser } from "firebase/auth";
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import styles from "./dashboard.module.css";

type DashboardTab = "overview" | "agents" | "automations" | "workflows" | "logs" | "settings";
type SettingsSubTab = "general" | "security" | "policies" | "api";

interface CountryOption {
  name: string;
  code: string;
  dialCode: string;
  flag: string;
}

const COUNTRIES: CountryOption[] = [
  { name: "United States", code: "US", dialCode: "+1", flag: "🇺🇸" },
  { name: "India", code: "IN", dialCode: "+91", flag: "🇮🇳" },
  { name: "United Kingdom", code: "GB", dialCode: "+44", flag: "🇬🇧" },
  { name: "Canada", code: "CA", dialCode: "+1", flag: "🇨🇦" },
  { name: "Australia", code: "AU", dialCode: "+61", flag: "🇦🇺" },
  { name: "Germany", code: "DE", dialCode: "+49", flag: "🇩🇪" },
  { name: "France", code: "FR", dialCode: "+33", flag: "🇫🇷" },
  { name: "Singapore", code: "SG", dialCode: "+65", flag: "🇸🇬" },
  { name: "United Arab Emirates", code: "AE", dialCode: "+971", flag: "🇦🇪" },
  { name: "Japan", code: "JP", dialCode: "+81", flag: "🇯🇵" },
  { name: "Netherlands", code: "NL", dialCode: "+31", flag: "🇳🇱" },
  { name: "Switzerland", code: "CH", dialCode: "+41", flag: "🇨🇭" },
  { name: "Brazil", code: "BR", dialCode: "+55", flag: "🇧🇷" },
  { name: "South Africa", code: "ZA", dialCode: "+27", flag: "🇿🇦" },
  { name: "Saudi Arabia", code: "SA", dialCode: "+966", flag: "🇸🇦" },
  { name: "Spain", code: "ES", dialCode: "+34", flag: "🇪🇸" },
  { name: "Italy", code: "IT", dialCode: "+39", flag: "🇮🇹" },
  { name: "Sweden", code: "SE", dialCode: "+46", flag: "🇸🇪" },
  { name: "Ireland", code: "IE", dialCode: "+353", flag: "🇮🇪" },
  { name: "New Zealand", code: "NZ", dialCode: "+64", flag: "🇳🇿" },
  { name: "South Korea", code: "KR", dialCode: "+82", flag: "🇰🇷" },
  { name: "Malaysia", code: "MY", dialCode: "+60", flag: "🇲🇾" },
];

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

  // Settings Sub-tab state (User requirement: keep the left menu of General in Settings)
  const [settingsTab, setSettingsTab] = useState<SettingsSubTab>("general");

  // Mobile number & custom country selector states
  const [selectedCountry, setSelectedCountry] = useState<CountryOption>(COUNTRIES[1]); // Default to India (+91)
  const [phoneNational, setPhoneNational] = useState<string>("");
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [isSavingPhone, setIsSavingPhone] = useState(false);
  const [phoneMessage, setPhoneMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const countryDropdownRef = useRef<HTMLDivElement>(null);

  // Close country selector dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
        setIsCountryDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
            if (data?.phoneNational) {
              setPhoneNational(data.phoneNational);
            } else if (data?.phoneNumber) {
              setPhoneNational(data.phoneNumber.replace(/^\+\d+\s*/, ""));
            }
            if (data?.phoneCountryCode) {
              const matched = COUNTRIES.find((c) => c.code === data.phoneCountryCode);
              if (matched) setSelectedCountry(matched);
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

  // Save mobile number to Firestore
  const handleSavePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setPhoneMessage({ type: "error", text: "You must be signed in to save your mobile number." });
      return;
    }

    if (!phoneNational.trim()) {
      setPhoneMessage({ type: "error", text: "Please enter your mobile phone number." });
      return;
    }

    setIsSavingPhone(true);
    setPhoneMessage(null);

    const fullPhoneNumber = `${selectedCountry.dialCode} ${phoneNational.trim()}`;

    try {
      await setDoc(
        doc(db, "users", currentUser.uid),
        {
          phoneNumber: fullPhoneNumber,
          phoneCountryCode: selectedCountry.code,
          phoneDialCode: selectedCountry.dialCode,
          phoneNational: phoneNational.trim(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setPhoneMessage({
        type: "success",
        text: "Saved",
      });
      setTimeout(() => {
        setPhoneMessage((prev) => (prev?.text === "Saved" ? null : prev));
      }, 4000);
    } catch (err) {
      console.error("Firestore phone update error:", err);
      setPhoneMessage({
        type: "error",
        text: "Could not save mobile number. Please try again.",
      });
    } finally {
      setIsSavingPhone(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch {
      // Continue navigation
    }
    router.push("/");
  };

  // Delete Account States & Handlers
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [unlockTimeLeft, setUnlockTimeLeft] = useState(3);
  const [isDeleteUnlocked, setIsDeleteUnlocked] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const unlockIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (unlockIntervalRef.current) clearInterval(unlockIntervalRef.current);
    };
  }, []);

  const handleOpenDeleteModal = () => {
    setIsDeleteModalOpen(true);
    setUnlockTimeLeft(3);
    setIsDeleteUnlocked(false);

    if (unlockIntervalRef.current) clearInterval(unlockIntervalRef.current);

    const startTime = Date.now();
    const duration = 3000;

    unlockIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, (duration - elapsed) / 1000);
      setUnlockTimeLeft(remaining);

      if (elapsed >= duration) {
        setIsDeleteUnlocked(true);
        setUnlockTimeLeft(0);
        if (unlockIntervalRef.current) {
          clearInterval(unlockIntervalRef.current);
          unlockIntervalRef.current = null;
        }
      }
    }, 50);
  };

  const handleCloseDeleteModal = () => {
    if (unlockIntervalRef.current) {
      clearInterval(unlockIntervalRef.current);
      unlockIntervalRef.current = null;
    }
    setIsDeleteModalOpen(false);
    setIsDeleteUnlocked(false);
    setUnlockTimeLeft(3);
  };

  const executeFullFirebaseDeletion = async () => {
    setIsDeleting(true);
    try {
      const activeUser = currentUser || auth.currentUser;
      const uid = activeUser?.uid;

      if (uid) {
        // 1. Delete user profile & settings document from Firestore
        try {
          await deleteDoc(doc(db, "users", uid));
          console.log("[Firebase Deletion] Deleted users doc for UID:", uid);
        } catch (e) {
          console.error("Could not delete user doc from Firestore:", e);
        }

        // 2. Delete user activities, workflows, logs
        try {
          await deleteDoc(doc(db, "activities", uid));
        } catch (e) {
          console.warn("Could not delete activities doc:", e);
        }
        try {
          await deleteDoc(doc(db, "user_activities", uid));
        } catch (e) {
          console.warn("Could not delete user_activities doc:", e);
        }
      }

      // 3. Clear cached client data
      try {
        if (typeof window !== "undefined") {
          localStorage.removeItem("operatsi_theme");
          sessionStorage.clear();
        }
      } catch {}

      // 4. Delete user authentication profile from Firebase Auth
      if (activeUser) {
        try {
          await deleteUser(activeUser);
          console.log("[Firebase Deletion] Successfully deleted Firebase Auth user profile");
        } catch (authErr: unknown) {
          console.warn("deleteUser required recent login, signing out user:", authErr);
          await signOut(auth);
        }
      } else {
        await signOut(auth);
      }
    } catch (err) {
      console.error("Deletion execution error:", err);
      try {
        await signOut(auth);
      } catch {}
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      router.push("/");
    }
  };

  const handleConfirmDelete = async () => {
    handleCloseDeleteModal();
    // Directly and permanently delete user data and auth profile from Firebase in the background
    await executeFullFirebaseDeletion();
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
              <MenuToggleIcon size={18} />
            </button>

            <div className={styles.breadcrumbGroup}>
              <span className={styles.breadcrumbRoot}>OperatSI</span>
              <span className={styles.breadcrumbSeparator}>/</span>
              <span className={styles.breadcrumbCurrent}>
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
              </span>
            </div>

            <div className={styles.statusPill}>
              <span className={styles.pulseDotWrapper}>
                <span className={styles.pulsePing} />
                <span className={styles.pulseDot} />
              </span>
              <span className={styles.statusText}>3 Online</span>
            </div>
          </div>

          {/* Search bar with smooth interactive expansion */}
          <div className={styles.searchBarWrapper}>
            <SearchIcon size={14} className={styles.searchIcon} />
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
              <PlusIcon size={13} className={styles.actionButtonIcon} />
              <span>New Agent</span>
            </button>

            <div className={styles.headerDivider} />

            <button
              type="button"
              className={styles.iconBtn}
              title="Notifications"
              aria-label="Notifications"
              onClick={() => alert("All 3 agents operating within normal bounds.")}
            >
              <BellIcon size={16} className={styles.bellIcon} />
              <span className={styles.unreadDot} />
            </button>

            {/* Global Theme Toggle */}
            <ThemeToggle />

            <div className={styles.headerDivider} />

            {/* Top User Pill: Compact, sleek chip */}
            <div
              className={styles.topUserPill}
              onClick={() => setActiveTab("settings")}
              title={`${activeUserName} (${activeUserEmail}) — Click to view settings`}
            >
              <div className={styles.topUserAvatar}>{userInitial}</div>
              <div className={styles.topUserDetails}>
                <span className={styles.topUserName}>{activeUserName}</span>
              </div>
            </div>

            <button
              type="button"
              className={`${styles.iconBtn} ${styles.logoutBtn}`}
              onClick={handleSignOut}
              title="Sign Out of Workspace"
              aria-label="Sign out"
            >
              <LogoutIcon size={16} />
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
          {/* =========================================================
              4. SETTINGS VIEW (PROFESSIONAL CORPORATE SETTINGS WITH LEFT SUB-MENU)
              ========================================================= */}
          {activeTab === "settings" && (
            <div className={styles.settingsLayout}>
              {/* Settings Left Sub-Navigation (General, Security, Policies, API) */}
              <aside className={styles.settingsSubNav} aria-label="Settings Sub-Navigation">
                <div className={styles.settingsSubNavHeader}>Settings</div>
                <button
                  type="button"
                  className={`${styles.settingsSubNavItem} ${
                    settingsTab === "general" ? styles.settingsSubNavItemActive : ""
                  }`}
                  onClick={() => setSettingsTab("general")}
                >
                  <UserIcon size={18} />
                  <span>General</span>
                </button>

                <button
                  type="button"
                  className={`${styles.settingsSubNavItem} ${
                    settingsTab === "security" ? styles.settingsSubNavItemActive : ""
                  }`}
                  onClick={() => setSettingsTab("security")}
                >
                  <ShieldCheckIcon size={18} />
                  <span>Security &amp; Access</span>
                </button>

                <button
                  type="button"
                  className={`${styles.settingsSubNavItem} ${
                    settingsTab === "policies" ? styles.settingsSubNavItemActive : ""
                  }`}
                  onClick={() => setSettingsTab("policies")}
                >
                  <AgentNodesIcon size={18} />
                  <span>Agent Policies</span>
                </button>

                <button
                  type="button"
                  className={`${styles.settingsSubNavItem} ${
                    settingsTab === "api" ? styles.settingsSubNavItemActive : ""
                  }`}
                  onClick={() => setSettingsTab("api")}
                >
                  <WorkflowBranchIcon size={18} />
                  <span>API &amp; Webhooks</span>
                </button>
              </aside>

              {/* Settings Content Area */}
              <div className={styles.settingsContent}>
                {settingsTab === "general" && (
                  <>
                    {/* General Settings: Identity & Contact Information */}
                    <div className={styles.settingsCard}>
                      <div className={styles.settingsCardHeader}>
                        <h2 className={styles.settingsCardTitle}>General</h2>
                      </div>

                      {/* Locked Identity Fields: User Name & User Email Address (CANNOT CHANGE) */}
                      <div className={styles.settingsFormRow}>
                        {/* 1. User Name (LOCKED / CANNOT CHANGE) */}
                        <div className={styles.settingsFormGroup}>
                          <div className={styles.settingsLabelRow}>
                            <label className={styles.settingsLabel} htmlFor="settings-user-name">
                              User Name
                            </label>
                            <span className={styles.readOnlyBadge}>
                              <LockIcon size={10} />
                              <span>Locked</span>
                            </span>
                          </div>
                          <div className={styles.lockedInputWrapper}>
                            <input
                              id="settings-user-name"
                              type="text"
                              className={styles.lockedInput}
                              value={activeUserName}
                              readOnly
                              disabled
                              title="User Name is locked and cannot be edited"
                            />
                            <div className={styles.lockIconAdornment}>
                              <LockIcon size={14} />
                            </div>
                          </div>
                        </div>

                        {/* 2. User Email Address (LOCKED / CANNOT CHANGE) */}
                        <div className={styles.settingsFormGroup}>
                          <div className={styles.settingsLabelRow}>
                            <label className={styles.settingsLabel} htmlFor="settings-user-email">
                              Email Address
                            </label>
                            <span className={styles.verifiedBadge}>
                              <CheckIcon size={11} />
                              <span>Verified</span>
                            </span>
                          </div>
                          <div className={styles.lockedInputWrapper}>
                            <input
                              id="settings-user-email"
                              type="email"
                              className={styles.lockedInput}
                              value={activeUserEmail}
                              readOnly
                              disabled
                              title="User Email Address is locked and cannot be edited"
                            />
                            <div className={styles.lockIconAdornment}>
                              <LockIcon size={14} />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 3. Mobile Number (EDITABLE & SAVED TO FIRESTORE WITH CUSTOM COUNTRY SELECTOR) */}
                      <form onSubmit={handleSavePhone} className={styles.settingsFormGroup}>
                        <div className={styles.settingsLabelRow}>
                          <label className={styles.settingsLabel} htmlFor="settings-mobile-phone">
                            Mobile Number
                          </label>
                        </div>

                        {/* Custom Country Code Selector & Compact Input Row */}
                        <div className={styles.phoneInputRow}>
                          <div className={styles.phoneInputGroup}>
                            {/* Custom Country Selector Trigger Button */}
                            <div ref={countryDropdownRef} style={{ position: "relative" }}>
                              <button
                                id="country-selector-trigger"
                                type="button"
                                className={styles.countrySelectorBtn}
                                onClick={() => {
                                  setIsCountryDropdownOpen((prev) => !prev);
                                  setCountrySearch("");
                                }}
                                aria-haspopup="listbox"
                                aria-expanded={isCountryDropdownOpen}
                                title="Select Country Code"
                              >
                                <span className={styles.countryFlag}>{selectedCountry.flag}</span>
                                <span className={styles.countryDialCode}>{selectedCountry.dialCode}</span>
                                <span
                                  className={`${styles.countryChevron} ${
                                    isCountryDropdownOpen ? styles.countryChevronOpen : ""
                                  }`}
                                >
                                  <ChevronRightIcon size={11} style={{ transform: "rotate(90deg)" }} />
                                </span>
                              </button>

                              {/* Floating Custom Country Dropdown Menu */}
                              {isCountryDropdownOpen && (
                                <div className={styles.countryDropdownMenu} role="listbox">
                                  <div className={styles.countrySearchBox}>
                                    <SearchIcon size={13} style={{ color: "var(--text-muted)" }} />
                                    <input
                                      type="text"
                                      placeholder="Search country..."
                                      value={countrySearch}
                                      onChange={(e) => setCountrySearch(e.target.value)}
                                      className={styles.countrySearchInput}
                                      autoFocus
                                    />
                                  </div>

                                  <div className={styles.countryList}>
                                    {COUNTRIES.filter(
                                      (c) =>
                                        c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
                                        c.dialCode.includes(countrySearch) ||
                                        c.code.toLowerCase().includes(countrySearch.toLowerCase())
                                    ).map((country) => {
                                      const isSelected = selectedCountry.code === country.code;
                                      return (
                                        <button
                                          key={country.code}
                                          type="button"
                                          role="option"
                                          aria-selected={isSelected}
                                          className={`${styles.countryOption} ${
                                            isSelected ? styles.countryOptionSelected : ""
                                          }`}
                                          onClick={() => {
                                            setSelectedCountry(country);
                                            setIsCountryDropdownOpen(false);
                                          }}
                                        >
                                          <span className={styles.countryFlag}>{country.flag}</span>
                                          <span className={styles.countryOptionName}>{country.name}</span>
                                          <span className={styles.countryOptionDial}>{country.dialCode}</span>
                                          {isSelected && <CheckIcon size={13} />}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* National Phone Number Input */}
                            <input
                              id="settings-mobile-phone"
                              type="tel"
                              inputMode="tel"
                              placeholder="Enter mobile number"
                              value={phoneNational}
                              onChange={(e) => setPhoneNational(e.target.value)}
                              className={styles.phoneInput}
                              autoComplete="tel-national"
                            />
                          </div>

                          {/* Compact Cute Save Button */}
                          <button
                            type="submit"
                            className={styles.savePhoneBtn}
                            disabled={isSavingPhone}
                          >
                            {isSavingPhone ? (
                              <>
                                <SpinnerIcon size={13} />
                                <span>Saving...</span>
                              </>
                            ) : (
                              <>
                                <CheckIcon size={13} />
                                <span>Save</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Save Feedback Alert */}
                        {phoneMessage && (
                          <div
                            className={
                              phoneMessage.type === "success" ? styles.phoneAlertSuccess : styles.phoneAlertError
                            }
                            role={phoneMessage.type === "success" ? "status" : "alert"}
                          >
                            {phoneMessage.type === "success" ? (
                              <CheckIcon size={13} />
                            ) : (
                              <AlertCircleIcon size={13} />
                            )}
                            <span>{phoneMessage.text}</span>
                          </div>
                        )}
                      </form>
                    </div>

                    {/* Danger Zone: Delete Account Card (Compact & Cute) */}
                    <div className={styles.dangerCard}>
                      <div className={styles.dangerCardHeader}>
                        <h3 className={styles.dangerCardTitle}>
                          <TrashIcon size={15} />
                          <span>Delete Account</span>
                        </h3>
                      </div>
                      <button
                        type="button"
                        className={styles.deleteInitiateBtn}
                        onClick={handleOpenDeleteModal}
                      >
                        <TrashIcon size={13} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </>
                )}

                {/* Security & Access Sub-Tab */}
                {settingsTab === "security" && (
                  <div className={styles.settingsCard}>
                    <div className={styles.settingsCardHeader}>
                      <h2 className={styles.settingsCardTitle}>Security</h2>
                    </div>
                    <div className={styles.settingsFormGroup}>
                      <span className={styles.settingsLabel}>Compliance</span>
                      <div className={styles.statusPill} style={{ alignSelf: "flex-start" }}>
                        <span className={styles.pulseDot} />
                        <span>SOC2 Type II Certified</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Agent Policies Sub-Tab */}
                {settingsTab === "policies" && (
                  <div className={styles.settingsCard}>
                    <div className={styles.settingsCardHeader}>
                      <h2 className={styles.settingsCardTitle}>Policies</h2>
                    </div>
                    <div className={styles.settingsFormRow}>
                      <div className={styles.settingsFormGroup}>
                        <label className={styles.settingsLabel}>Max Parallel Agents</label>
                        <input type="number" className={styles.lockedInput} defaultValue={10} />
                      </div>
                      <div className={styles.settingsFormGroup}>
                        <label className={styles.settingsLabel}>Timeout (seconds)</label>
                        <input type="number" className={styles.lockedInput} defaultValue={300} />
                      </div>
                    </div>
                  </div>
                )}

                {/* API & Webhooks Sub-Tab */}
                {settingsTab === "api" && (
                  <div className={styles.settingsCard}>
                    <div className={styles.settingsCardHeader}>
                      <h2 className={styles.settingsCardTitle}>API Keys</h2>
                    </div>
                    <div className={styles.settingsFormGroup}>
                      <label className={styles.settingsLabel}>Production Key</label>
                      <input
                        type="password"
                        className={styles.lockedInput}
                        value="opsi_live_9837492817491029481"
                        readOnly
                        disabled
                      />
                    </div>
                  </div>
                )}
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

      {/* Floating 3-Second Unlock Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className={styles.modalOverlay} onClick={handleCloseDeleteModal}>
          <div
            className={styles.modalDialog}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div className={styles.modalIconWrapper}>
                <AlertCircleIcon size={24} />
              </div>
              <div className={styles.modalHeaderContent}>
                <h3 className={styles.modalTitle}>Delete OperatSI Account?</h3>
                <p className={styles.modalSubtitle}>
                  This action is permanent and cannot be undone once confirmed.
                </p>
              </div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={handleCloseDeleteModal}
                aria-label="Close dialog"
              >
                <CloseIcon size={18} />
              </button>
            </div>

            <div className={styles.deletionWarningBox}>
              <p>
                <strong>Warning:</strong> You are about to initiate the permanent deletion of your account and all associated Firebase assets.
              </p>
              <ul className={styles.deletionWarningList}>
                <li>All profile records ({activeUserName}, {activeUserEmail})</li>
                <li>Saved mobile numbers and security preferences</li>
                <li>Workspace access tokens, credentials, and configurations</li>
                <li>All user activity logs and automated workflows in OperatSI</li>
              </ul>
            </div>

            <div className={styles.delayProgressWrapper}>
              <div className={styles.delayProgressTrack}>
                <div
                  className={styles.delayProgressFill}
                  style={{ width: `${Math.min(100, ((3 - unlockTimeLeft) / 3) * 100)}%` }}
                />
              </div>
              <div className={styles.delayProgressText}>
                {!isDeleteUnlocked ? (
                  <>
                    <SpinnerIcon size={13} />
                    <span>Unlocking delete action in {Math.ceil(unlockTimeLeft)}s...</span>
                  </>
                ) : (
                  <>
                    <CheckIcon size={13} />
                    <span>Safety delay complete. You may now proceed.</span>
                  </>
                )}
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.cancelModalBtn}
                onClick={handleCloseDeleteModal}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.confirmDeleteBtn}
                disabled={!isDeleteUnlocked || isDeleting}
                onClick={handleConfirmDelete}
              >
                {isDeleting ? (
                  <>
                    <SpinnerIcon size={16} />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <TrashIcon size={16} />
                    <span>Confirm &amp; Delete Everything</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
