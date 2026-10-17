"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/AppLayout";
import { useTheme, ThemeMode } from "@/context/ThemeContext";
import {
  UserIcon,
  KeyRoundIcon,
  PaletteIcon,
  BellIcon,
  BuildingIcon,
  TeamIcon,
  LayersIcon,
  IntegrationsIcon,
  OperatsiAiIcon,
  NanoAgentsIcon,
  CloudBrowserIcon,
  TasksCheckIcon,
  ShieldCheckIcon,
  DatabaseIcon,
  BillingIcon,
  DocumentsIcon,
  AlertCircleIcon,
  CheckIcon,
  SpinnerIcon,
  TrashIcon,
  CloseIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  SearchIcon,
  CopyIcon,
  DownloadIcon,
  UploadIcon,
  ExternalLinkIcon,
  LightModeIcon,
  DarkModeIcon,
  SystemModeIcon,
  GoogleIcon,
  AppleIcon,
} from "@/components/Icons";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User, deleteUser, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { CustomSelect, SelectOption } from "@/components/CustomSelect";
import styles from "./settings.module.css";

// -------------------------------------------------------------
// NAVIGATION DEFINITIONS (STRICTLY FLAT — 4 GROUPS, 17 DESTINATIONS)
// -------------------------------------------------------------
export type SettingsSectionId =
  | "my-profile"
  | "account"
  | "appearance"
  | "notifications"
  | "general"
  | "members"
  | "departments"
  | "integrations"
  | "ai-preferences"
  | "nano-agents"
  | "cloud-browser"
  | "approvals"
  | "security"
  | "data-privacy"
  | "billing"
  | "audit-logs"
  | "danger-zone";

interface SettingsNavGroup {
  groupTitle: string;
  items: {
    id: SettingsSectionId;
    label: string;
    icon: React.ComponentType<{ size?: number }>;
    isDanger?: boolean;
  }[];
}

const SETTINGS_NAV_GROUPS: SettingsNavGroup[] = [
  {
    groupTitle: "YOUR ACCOUNT",
    items: [
      { id: "my-profile", label: "My Profile", icon: UserIcon },
      { id: "account", label: "Account & Sign-in", icon: KeyRoundIcon },
      { id: "appearance", label: "Appearance", icon: PaletteIcon },
      { id: "notifications", label: "Notifications", icon: BellIcon },
    ],
  },
  {
    groupTitle: "WORKSPACE",
    items: [
      { id: "general", label: "General", icon: BuildingIcon },
      { id: "members", label: "Members & Roles", icon: TeamIcon },
      { id: "departments", label: "Departments", icon: LayersIcon },
      { id: "integrations", label: "Integrations", icon: IntegrationsIcon },
    ],
  },
  {
    groupTitle: "AI & AUTOMATION",
    items: [
      { id: "ai-preferences", label: "AI Preferences", icon: OperatsiAiIcon },
      { id: "nano-agents", label: "Nano Agents", icon: NanoAgentsIcon },
      { id: "cloud-browser", label: "Cloud Browser", icon: CloudBrowserIcon },
      { id: "approvals", label: "Approvals", icon: TasksCheckIcon },
    ],
  },
  {
    groupTitle: "ADMINISTRATION",
    items: [
      { id: "security", label: "Security", icon: ShieldCheckIcon },
      { id: "data-privacy", label: "Data & Privacy", icon: DatabaseIcon },
      { id: "billing", label: "Billing & Usage", icon: BillingIcon },
      { id: "audit-logs", label: "Audit Logs", icon: DocumentsIcon },
      { id: "danger-zone", label: "Danger Zone", icon: AlertCircleIcon, isDanger: true },
    ],
  },
];

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
  { name: "Saudi Arabia", code: "SA", dialCode: "+966", flag: "🇸🇦" },
  { name: "Japan", code: "JP", dialCode: "+81", flag: "🇯🇵" },
  { name: "China", code: "CN", dialCode: "+86", flag: "🇨🇳" },
  { name: "South Korea", code: "KR", dialCode: "+82", flag: "🇰🇷" },
  { name: "Netherlands", code: "NL", dialCode: "+31", flag: "🇳🇱" },
  { name: "Switzerland", code: "CH", dialCode: "+41", flag: "🇨🇭" },
  { name: "Sweden", code: "SE", dialCode: "+46", flag: "🇸🇪" },
  { name: "Norway", code: "NO", dialCode: "+47", flag: "🇳🇴" },
  { name: "Spain", code: "ES", dialCode: "+34", flag: "🇪🇸" },
  { name: "Italy", code: "IT", dialCode: "+39", flag: "🇮🇹" },
  { name: "Ireland", code: "IE", dialCode: "+353", flag: "🇮🇪" },
  { name: "Brazil", code: "BR", dialCode: "+55", flag: "🇧🇷" },
  { name: "Mexico", code: "MX", dialCode: "+52", flag: "🇲🇽" },
  { name: "South Africa", code: "ZA", dialCode: "+27", flag: "🇿🇦" },
  { name: "Malaysia", code: "MY", dialCode: "+60", flag: "🇲🇾" },
  { name: "Indonesia", code: "ID", dialCode: "+62", flag: "🇮🇩" },
  { name: "New Zealand", code: "NZ", dialCode: "+64", flag: "🇳🇿" },
];

const LANGUAGE_OPTIONS: SelectOption[] = [
  { value: "en-US", label: "English (United States)" },
  { value: "en-GB", label: "English (United Kingdom)" },
  { value: "de-DE", label: "Deutsch (German)" },
  { value: "fr-FR", label: "Français (French)" },
  { value: "ja-JP", label: "日本語 (Japanese)" },
  { value: "es-ES", label: "Español (Spanish)" },
];

const TIMEZONE_OPTIONS: SelectOption[] = [
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
  { value: "America/New_York", label: "Eastern Time (US & Canada)" },
  { value: "America/Los_Angeles", label: "Pacific Time (US & Canada)" },
  { value: "Europe/London", label: "London (GMT / BST)" },
  { value: "Europe/Frankfurt", label: "Frankfurt (CET)" },
  { value: "Asia/Kolkata", label: "India Standard Time (IST)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Asia/Singapore", label: "Singapore (SGT)" },
];

const DENSITY_OPTIONS: SelectOption[] = [
  { value: "comfortable", label: "Comfortable", badge: "Default", description: "Generous whitespace for executive readability" },
  { value: "compact", label: "Compact (High Density)", badge: "Pro", description: "Optimized for dense data tables & analyst workflows" },
];

const INDUSTRY_OPTIONS: SelectOption[] = [
  { value: "saas", label: "Enterprise SaaS & Technology", badge: "Core", description: "Software platforms, cloud services & AI" },
  { value: "fintech", label: "Financial Services & Banking", description: "Capital markets, banking, fintech & payments" },
  { value: "healthcare", label: "Healthcare & Life Sciences", description: "Biopharma, providers, clinical & health tech" },
  { value: "logistics", label: "Supply Chain & Logistics", description: "Freight, global logistics, retail & fulfillment" },
  { value: "consulting", label: "Professional & Legal Services", description: "Consulting firms, legal advisory & corporate auditing" },
];

const COMPANY_SIZE_OPTIONS: SelectOption[] = [
  { value: "10", label: "1 – 10 Team Members", description: "Seed / Startup founding team" },
  { value: "50", label: "11 – 50 Team Members", description: "Early growth stage" },
  { value: "200", label: "51 – 200 Team Members", badge: "Selected", description: "Mid-market enterprise" },
  { value: "1000", label: "201 – 1,000 Team Members", description: "Scaling corporate enterprise" },
  { value: "enterprise", label: "1,000+ Enterprise Fleet", badge: "Fleet", description: "Global multi-subsidiary enterprise" },
];

const DATA_REGION_OPTIONS: SelectOption[] = [
  { value: "us-east-1", label: "US East (N. Virginia)", badge: "Multi-Cloud", description: "AWS & GCP Multi-Cloud mesh with sub-10ms latency" },
  { value: "us-west-2", label: "US West (Oregon)", description: "GCP Isolated zero-trust enclave" },
  { value: "eu-central-1", label: "Europe Central (Frankfurt)", badge: "GDPR", description: "Frankfurt sovereign cloud with strict EU residency" },
  { value: "ap-southeast-1", label: "Asia Pacific (Singapore)", description: "Tier-4 datacenter with low latency for APAC" },
];

const INVITE_ROLE_OPTIONS: SelectOption[] = [
  { value: "Admin", label: "Admin", badge: "Elevated", description: "Full operational control, billing & security permissions" },
  { value: "Member", label: "Member", badge: "Standard", description: "Autonomous agent execution, CRM & workflow management" },
  { value: "Viewer", label: "Viewer", description: "Read-only telemetry, reports & execution logs" },
];

const AI_MODEL_OPTIONS: SelectOption[] = [
  { value: "claude-3-7-sonnet", label: "Claude 3.7 Sonnet", badge: "Thinking", description: "Extended thinking & deep code architecture synthesis" },
  { value: "gpt-4o", label: "OpenAI GPT-4o Enterprise", badge: "Fast", description: "High-throughput multimodal reasoning & execution" },
  { value: "gemini-2-5-pro", label: "Google Gemini 2.5 Pro Ultra", badge: "2M Context", description: "Massive context analysis for deep document corpuses" },
  { value: "operatsi-hybrid", label: "OperatSI Adaptive Neural Route", badge: "Automated", description: "Dynamically switches models for cost-latency optimization" },
];

const AI_STYLE_OPTIONS: SelectOption[] = [
  { value: "concise", label: "Concise & Action-Oriented", badge: "Enterprise", description: "Direct outputs without redundant preamble" },
  { value: "balanced", label: "Balanced with Step-by-Step Rationale", badge: "Recommended", description: "Clear explanations with structured actionable next steps" },
  { value: "exhaustive", label: "Exhaustive & Academic", description: "Full audit citations, chain-of-thought, and deep context" },
];

const BROWSER_PERSONA_OPTIONS: SelectOption[] = [
  { value: "stealth", label: "Stealth Chromium", badge: "Anti-Detection", description: "Anti-bot evasion, fingerprint masking & proxy rotation" },
  { value: "desktop", label: "Standard Desktop Chrome", description: "Windows 11 enterprise Chrome profile" },
  { value: "mac", label: "Standard Desktop Safari", description: "macOS Sonoma WebKit identity" },
];

const AUDIT_RETENTION_OPTIONS: SelectOption[] = [
  { value: "30", label: "30 Days", description: "Standard operational logs" },
  { value: "90", label: "90 Days", badge: "SOC2", description: "Standard compliance baseline" },
  { value: "365", label: "1 Year", badge: "Enterprise", description: "Long-term regulatory archival" },
];

const AGENT_RETENTION_OPTIONS: SelectOption[] = [
  { value: "14", label: "14 Days", description: "High turnover debug traces" },
  { value: "30", label: "30 Days", badge: "Default", description: "Recommended execution trace lifecycle" },
  { value: "60", label: "60 Days", description: "Extended forensics retention" },
];

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  // Active section state (Flat 1-click navigation)
  const [activeSection, setActiveSection] = useState<SettingsSectionId>("my-profile");

  // User auth and firestore profile details
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [displayName, setDisplayName] = useState<string>("");
  const [jobTitle, setJobTitle] = useState<string>("Principal Enterprise Architect");
  const [language, setLanguage] = useState<string>("en-US");
  const [timeZone, setTimeZone] = useState<string>("UTC");
  const [bio, setBio] = useState<string>("Leading enterprise autonomous agent orchestration and business telemetry.");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<string | null>(null);

  // Mobile number & custom country selector states
  const [selectedCountry, setSelectedCountry] = useState<CountryOption>(COUNTRIES[1]);
  const [phoneNational, setPhoneNational] = useState<string>("");
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [isSavingPhone, setIsSavingPhone] = useState(false);
  const [phoneMessage, setPhoneMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const countryDropdownRef = useRef<HTMLDivElement>(null);

  // Workspace state
  const [workspaceName, setWorkspaceName] = useState("OperatSI Enterprise Core");
  const [workspaceSlug] = useState("operatsi-core-prod-01");
  const [isCopiedSlug, setIsCopiedSlug] = useState(false);
  const [industry, setIndustry] = useState("saas");
  const [companySize, setCompanySize] = useState("200");
  const [dataRegion, setDataRegion] = useState("us-east-1");
  const [workspaceFeedback, setWorkspaceFeedback] = useState<string | null>(null);

  // Appearance state
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [reducedMotion, setReducedMotion] = useState(false);
  const [autoCollapseSidebar, setAutoCollapseSidebar] = useState(false);
  const [showUnreadBadges, setShowUnreadBadges] = useState(true);

  // Notification toggles
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [inAppAlerts, setInAppAlerts] = useState(true);
  const [browserAlerts, setBrowserAlerts] = useState(true);
  const [taskAlerts, setTaskAlerts] = useState(true);
  const [agentAlerts, setAgentAlerts] = useState(true);
  const [approvalAlerts, setApprovalAlerts] = useState(true);
  const [inviteAlerts, setInviteAlerts] = useState(true);

  // AI & Automation state
  const [defaultAiModel, setDefaultAiModel] = useState("claude-3-7-sonnet");
  const [aiStyle, setAiStyle] = useState("balanced");
  const [contextTokens, setContextTokens] = useState(64);
  const [monthlyTokenCap, setMonthlyTokenCap] = useState(500);
  const [piiRedaction, setPiiRedaction] = useState(true);

  // Nano Agents state
  const [concurrentAgents, setConcurrentAgents] = useState(10);
  const [agentTimeout, setAgentTimeout] = useState(300);
  const [autoRetry, setAutoRetry] = useState(true);

  // Cloud Browser state
  const [concurrentBrowsers, setConcurrentBrowsers] = useState(5);
  const [browserPersona, setBrowserPersona] = useState("stealth");
  const [headlessMode, setHeadlessMode] = useState(false);
  const [recordSessions, setRecordSessions] = useState(true);

  // Data & Privacy retention state
  const [auditRetention, setAuditRetention] = useState("90");
  const [agentRetention, setAgentRetention] = useState("30");

  // Security state
  const [mfaEnforced, setMfaEnforced] = useState(true);
  const [apiKeyCopied, setApiKeyCopied] = useState(false);

  // Invite member modal
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Member");
  const [membersList, setMembersList] = useState([
    { id: "1", name: "Krishanth B", email: "krishanth.b.2008@gmail.com", role: "Owner", status: "Active", lastActive: "Just now" },
    { id: "2", name: "Sarah Jenkins", email: "s.jenkins@operatsi.com", role: "Admin", status: "Active", lastActive: "14m ago" },
    { id: "3", name: "Alex Rivera", email: "a.rivera@operatsi.com", role: "Member", status: "Active", lastActive: "2h ago" },
    { id: "4", name: "Elena Rostova", email: "e.rostova@operatsi.com", role: "Viewer", status: "Active", lastActive: "1d ago" },
  ]);

  // Delete Account State & Handlers (Danger Zone)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [unlockTimeLeft, setUnlockTimeLeft] = useState(3);
  const [isDeleteUnlocked, setIsDeleteUnlocked] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const unlockIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
        setIsCountryDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
              setDisplayName(data.displayName || data.name);
            }
            if (data?.jobTitle) setJobTitle(data.jobTitle);
            if (data?.language) setLanguage(data.language);
            if (data?.timeZone) setTimeZone(data.timeZone);
            if (data?.bio) setBio(data.bio);
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
          // Keep current state
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const activeUserName = formatDisplayName(currentUser, userName);
  const activeUserEmail = currentUser?.email || "krishanth.b.2008@gmail.com";

  // Save Profile Changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsSavingProfile(true);
    setProfileFeedback(null);
    try {
      const fullPhoneNumber = phoneNational.trim()
        ? `${selectedCountry.dialCode} ${phoneNational.trim()}`
        : "";
      await setDoc(
        doc(db, "users", currentUser.uid),
        {
          displayName: displayName || activeUserName,
          jobTitle,
          language,
          timeZone,
          bio,
          phoneNumber: fullPhoneNumber,
          phoneCountryCode: selectedCountry.code,
          phoneDialCode: selectedCountry.dialCode,
          phoneNational: phoneNational.trim(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      setProfileFeedback("Profile changes saved successfully.");
      setTimeout(() => setProfileFeedback(null), 3500);
    } catch {
      setProfileFeedback("Failed to save changes. Please try again.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Save Mobile Number
  const handleSavePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setPhoneMessage({ type: "error", text: "You must be signed in to save phone number." });
      return;
    }

    setIsSavingPhone(true);
    setPhoneMessage(null);

    try {
      const fullPhoneNumber = `${selectedCountry.dialCode} ${phoneNational.trim()}`;
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

      setPhoneMessage({ type: "success", text: "Mobile number updated." });
      setTimeout(() => setPhoneMessage(null), 4000);
    } catch {
      setPhoneMessage({ type: "error", text: "Could not save mobile number. Please try again." });
    } finally {
      setIsSavingPhone(false);
    }
  };

  // Copy Workspace Slug
  const handleCopySlug = () => {
    navigator.clipboard.writeText(workspaceSlug);
    setIsCopiedSlug(true);
    setTimeout(() => setIsCopiedSlug(false), 2500);
  };

  // Export Data Download
  const handleExportData = () => {
    const exportData = {
      product: "OperatSI Business OS",
      organization: "OVIC Labs",
      exportedAt: new Date().toISOString(),
      user: { name: activeUserName, email: activeUserEmail },
      workspace: { name: workspaceName, slug: workspaceSlug },
      settings: {
        theme,
        density,
        aiModel: defaultAiModel,
        concurrentAgents,
        concurrentBrowsers,
      },
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `operatsi-workspace-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Danger Zone Deletion Handlers
  const handleOpenDeleteModal = () => {
    setIsDeleteModalOpen(true);
    setIsDeleteUnlocked(false);
    setUnlockTimeLeft(3);

    if (unlockIntervalRef.current) clearInterval(unlockIntervalRef.current);
    unlockIntervalRef.current = setInterval(() => {
      setUnlockTimeLeft((prev) => {
        if (prev <= 1) {
          if (unlockIntervalRef.current) clearInterval(unlockIntervalRef.current);
          setIsDeleteUnlocked(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleCloseDeleteModal = () => {
    if (unlockIntervalRef.current) clearInterval(unlockIntervalRef.current);
    setIsDeleteModalOpen(false);
    setIsDeleting(false);
  };

  const executeFullFirebaseDeletion = async () => {
    const activeUser = auth.currentUser || currentUser;
    const uidToDelete = activeUser?.uid;

    if (uidToDelete) {
      try {
        await deleteDoc(doc(db, "users", uidToDelete));
      } catch {}
      try {
        await deleteDoc(doc(db, "activities", uidToDelete));
      } catch {}
      try {
        await deleteDoc(doc(db, "user_activities", uidToDelete));
      } catch {}
    }

    if (activeUser) {
      try {
        await deleteUser(activeUser);
      } catch {
        try {
          await signOut(auth);
        } catch {}
      }
    }
  };

  const handleConfirmPermanentDelete = async () => {
    setIsDeleting(true);
    executeFullFirebaseDeletion().catch(() => {});
    setIsDeleteModalOpen(false);
    setIsDeleting(false);
    router.push("/");
  };

  return (
    <AppLayout activeRoute="/settings">
      <div className={styles.settingsContainer}>
        {/* Mobile / Tablet Horizontal Category Strip */}
        <div className={styles.mobileNavScroll} role="tablist" aria-label="Settings categories">
          {SETTINGS_NAV_GROUPS.flatMap((g) => g.items).map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`${styles.mobileNavPill} ${isActive ? styles.mobileNavPillActive : ""}`}
                onClick={() => setActiveSection(item.id)}
              >
                <Icon size={14} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* 3-Region Layout: Region B (Settings Nav) + Region C (Settings Content) */}
        <div className={styles.settingsLayout}>
          {/* REGION B: SETTINGS NAVIGATION (FLAT, NO NESTED EXPANDABLES) */}
          <aside className={styles.settingsNav} aria-label="Settings sections navigation">
            {SETTINGS_NAV_GROUPS.map((group) => (
              <div key={group.groupTitle} className={styles.navGroup}>
                <div className={styles.navGroupTitle}>{group.groupTitle}</div>
                <ul className={styles.navList}>
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeSection === item.id;
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          className={`${styles.navItemBtn} ${isActive ? styles.navItemActive : ""} ${
                            item.isDanger ? styles.navItemDanger : ""
                          }`}
                          onClick={() => setActiveSection(item.id)}
                        >
                          <span className={styles.navItemIcon}>
                            <Icon size={16} />
                          </span>
                          <span className={styles.navItemLabel}>{item.label}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </aside>

          {/* REGION C: SETTINGS CONTENT AREA */}
          <main className={styles.settingsContent}>
            {/* 1. MY PROFILE */}
            {activeSection === "my-profile" && (
              <div>
                <header className={styles.pageHeader}>
                  <div className={styles.pageTitleGroup}>
                    <h1 className={styles.pageTitle}>
                      <UserIcon size={20} />
                      <span>My Profile</span>
                    </h1>
                    <p className={styles.pageDescription}>
                      Manage your personal identity, contact information, localization, and profile preferences across OperatSI.
                    </p>
                  </div>
                </header>

                <form onSubmit={handleSaveProfile}>
                  <div className={styles.sectionCard}>
                    <div className={styles.sectionHeader}>
                      <div>
                        <h2 className={styles.sectionHeaderTitle}>Profile Identity</h2>
                        <p className={styles.sectionHeaderSubtitle}>Avatar and public credentials visible across workspace teams.</p>
                      </div>
                    </div>

                    <div className={styles.avatarUploadRow}>
                      <div className={styles.avatarLarge}>
                        {activeUserName.charAt(0).toUpperCase()}
                      </div>
                      <div className={styles.avatarActions}>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <button type="button" className={styles.btnSecondary} onClick={() => alert("Photo upload dialog opened.")}>
                            <UploadIcon size={14} />
                            <span>Upload New Photo</span>
                          </button>
                          <button type="button" className={styles.btnSecondary} onClick={() => alert("Avatar reset to initials.")}>
                            Remove
                          </button>
                        </div>
                        <span className={styles.formHint}>Recommended: 400x400 JPG or PNG. Max size: 4MB.</span>
                      </div>
                    </div>

                    <div className={styles.formGrid}>
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>
                          <span>User Name</span>
                          <span className={styles.formHint}>(Account Identifier)</span>
                        </label>
                        <input
                          type="text"
                          className={`${styles.input} ${styles.lockedInput}`}
                          value={activeUserName}
                          readOnly
                          title="Contact workspace administrator to alter registered username"
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Display Name</label>
                        <input
                          type="text"
                          className={styles.input}
                          value={displayName || activeUserName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="How your name appears to colleagues"
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Job Title</label>
                        <input
                          type="text"
                          className={styles.input}
                          value={jobTitle}
                          onChange={(e) => setJobTitle(e.target.value)}
                          placeholder="e.g. Principal Architect / Engineering Lead"
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Email Address</label>
                        <input
                          type="email"
                          className={`${styles.input} ${styles.lockedInput}`}
                          value={activeUserEmail}
                          readOnly
                          title="Contact workspace administrator to alter registered email"
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Mobile Number</label>
                        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                          {/* Country Code Trigger */}
                          <div ref={countryDropdownRef} style={{ position: "relative" }}>
                            <button
                              type="button"
                              className={styles.input}
                              style={{
                                width: "auto",
                                minWidth: "110px",
                                height: "38px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: "0.45rem",
                                cursor: "pointer",
                                padding: "0.55rem 0.65rem",
                              }}
                              onClick={() => {
                                setIsCountryDropdownOpen((prev) => !prev);
                                setCountrySearch("");
                              }}
                              aria-haspopup="listbox"
                              aria-expanded={isCountryDropdownOpen}
                              title="Select country code"
                            >
                              <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                <span style={{ fontSize: "1rem", lineHeight: 1 }}>{selectedCountry.flag}</span>
                                <span style={{ fontWeight: 600, fontSize: "0.8125rem", color: "var(--text-primary)" }}>
                                  {selectedCountry.dialCode}
                                </span>
                              </span>
                              <ChevronDownIcon
                                size={12}
                                style={{
                                  color: "var(--text-muted)",
                                  transition: "transform 0.15s ease",
                                  transform: isCountryDropdownOpen ? "rotate(180deg)" : "none",
                                }}
                              />
                            </button>

                            {isCountryDropdownOpen && (
                              <div
                                style={{
                                  position: "absolute",
                                  top: "calc(100% + 4px)",
                                  left: 0,
                                  width: "260px",
                                  background: "var(--card-bg)",
                                  border: "1px solid var(--card-border)",
                                  borderRadius: "10px",
                                  boxShadow: "0 12px 30px -4px rgba(0, 0, 0, 0.35), 0 4px 12px -2px rgba(0, 0, 0, 0.2)",
                                  zIndex: 90,
                                  padding: "0.4rem",
                                  maxHeight: "260px",
                                  overflowY: "auto",
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.25rem 0.5rem 0.5rem" }}>
                                  <SearchIcon size={13} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                                  <input
                                    type="text"
                                    placeholder="Search country..."
                                    value={countrySearch}
                                    onChange={(e) => setCountrySearch(e.target.value)}
                                    className={styles.input}
                                    style={{ padding: "0.3rem 0.5rem", fontSize: "0.775rem", height: "30px" }}
                                    autoFocus
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>

                                <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                                  {COUNTRIES.filter(
                                    (c) =>
                                      c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
                                      c.dialCode.includes(countrySearch)
                                  ).map((country) => (
                                    <button
                                      key={country.code}
                                      type="button"
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        width: "100%",
                                        padding: "0.45rem 0.65rem",
                                        background: selectedCountry.code === country.code ? "rgba(37,99,235,0.12)" : "transparent",
                                        border: "none",
                                        borderRadius: "6px",
                                        color: selectedCountry.code === country.code ? "#3b82f6" : "var(--text-primary)",
                                        fontSize: "0.8125rem",
                                        fontWeight: selectedCountry.code === country.code ? 600 : 500,
                                        cursor: "pointer",
                                        textAlign: "left",
                                      }}
                                      onClick={() => {
                                        setSelectedCountry(country);
                                        setIsCountryDropdownOpen(false);
                                      }}
                                    >
                                      <span>{country.flag} {country.name}</span>
                                      <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 500 }}>
                                        {country.dialCode}
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* National Phone Number */}
                          <input
                            type="tel"
                            inputMode="tel"
                            placeholder="Mobile phone number"
                            value={phoneNational}
                            onChange={(e) => setPhoneNational(e.target.value)}
                            className={styles.input}
                            style={{ flex: 1, height: "38px" }}
                          />
                        </div>
                      </div>

                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Preferred Language</label>
                        <CustomSelect
                          value={language}
                          onChange={(val) => setLanguage(val)}
                          options={LANGUAGE_OPTIONS}
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Time Zone</label>
                        <CustomSelect
                          value={timeZone}
                          onChange={(val) => setTimeZone(val)}
                          options={TIMEZONE_OPTIONS}
                        />
                      </div>

                      <div className={`${styles.formGroup} ${styles.formGridFull}`}>
                        <label className={styles.formLabel}>Professional Bio</label>
                        <textarea
                          rows={3}
                          className={styles.textarea}
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          placeholder="Brief description of your role and responsibilities..."
                        />
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", paddingTop: "0.5rem" }}>
                      <button type="submit" className={styles.btnPrimary} disabled={isSavingProfile}>
                        {isSavingProfile ? (
                          <>
                            <SpinnerIcon size={14} />
                            <span>Saving Changes...</span>
                          </>
                        ) : (
                          <>
                            <CheckIcon size={14} />
                            <span>Save Profile</span>
                          </>
                        )}
                      </button>
                    </div>

                    {profileFeedback && (
                      <div className={`${styles.feedbackToast} ${styles.toastSuccess}`}>
                        <CheckIcon size={14} />
                        <span>{profileFeedback}</span>
                      </div>
                    )}
                  </div>
                </form>
              </div>
            )}

            {/* 2. ACCOUNT & SIGN-IN */}
            {activeSection === "account" && (
              <div>
                <header className={styles.pageHeader}>
                  <div className={styles.pageTitleGroup}>
                    <h1 className={styles.pageTitle}>
                      <KeyRoundIcon size={20} />
                      <span>Account &amp; Sign-in</span>
                    </h1>
                    <p className={styles.pageDescription}>
                      Manage authentication credentials, federated OAuth providers, verified phone number, and active login sessions.
                    </p>
                  </div>
                </header>

                {/* Email & Phone */}
                <div className={styles.sectionCard}>
                  <div className={styles.sectionHeader}>
                    <div>
                      <h2 className={styles.sectionHeaderTitle}>Sign-in Credentials</h2>
                      <p className={styles.sectionHeaderSubtitle}>Primary identifiers used to authenticate into your OperatSI account.</p>
                    </div>
                  </div>

                  <div className={styles.settingRow}>
                    <div className={styles.settingInfo}>
                      <h3 className={styles.settingTitle}>Primary Email</h3>
                      <p className={styles.settingDesc}>{activeUserEmail}</p>
                    </div>
                    <div className={styles.settingControl}>
                    </div>
                  </div>

                  {/* Mobile Number */}
                  <form onSubmit={handleSavePhone} style={{ paddingTop: "1rem" }}>
                    <div className={styles.settingRow} style={{ borderBottom: "none" }}>
                      <div className={styles.settingInfo}>
                        <h3 className={styles.settingTitle}>Mobile Number</h3>
                        <p className={styles.settingDesc}>Used for multi-factor authentication (MFA) and urgent security alerts.</p>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", marginTop: "0.5rem" }}>
                      {/* Country Selector Dropdown */}
                      <div ref={countryDropdownRef} style={{ position: "relative" }}>
                        <button
                          type="button"
                          className={styles.btnSecondary}
                          style={{ minWidth: "125px", justifyContent: "space-between" }}
                          onClick={() => {
                            setIsCountryDropdownOpen((prev) => !prev);
                            setCountrySearch("");
                          }}
                          aria-haspopup="listbox"
                          aria-expanded={isCountryDropdownOpen}
                        >
                          <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                            <span>{selectedCountry.flag}</span>
                            <span style={{ fontWeight: 600 }}>{selectedCountry.dialCode}</span>
                          </span>
                          <ChevronDownIcon size={12} style={{ color: "var(--text-muted)" }} />
                        </button>

                        {isCountryDropdownOpen && (
                          <div
                            style={{
                              position: "absolute",
                              top: "100%",
                              left: 0,
                              marginTop: "4px",
                              width: "240px",
                              background: "var(--card-bg)",
                              border: "1px solid var(--card-border)",
                              borderRadius: "8px",
                              boxShadow: "var(--modal-shadow)",
                              zIndex: 50,
                              padding: "0.5rem",
                              maxHeight: "260px",
                              overflowY: "auto",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.25rem 0.5rem 0.5rem" }}>
                              <SearchIcon size={13} style={{ color: "var(--text-muted)" }} />
                              <input
                                type="text"
                                placeholder="Search country..."
                                value={countrySearch}
                                onChange={(e) => setCountrySearch(e.target.value)}
                                className={styles.input}
                                style={{ padding: "0.25rem 0.45rem", fontSize: "0.75rem" }}
                                autoFocus
                              />
                            </div>

                            {COUNTRIES.filter(
                              (c) =>
                                c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
                                c.dialCode.includes(countrySearch)
                            ).map((country) => (
                              <button
                                key={country.code}
                                type="button"
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  width: "100%",
                                  padding: "0.45rem 0.65rem",
                                  background: selectedCountry.code === country.code ? "rgba(37,99,235,0.12)" : "transparent",
                                  border: "none",
                                  borderRadius: "6px",
                                  color: "var(--text-primary)",
                                  fontSize: "0.785rem",
                                  cursor: "pointer",
                                  textAlign: "left",
                                }}
                                onClick={() => {
                                  setSelectedCountry(country);
                                  setIsCountryDropdownOpen(false);
                                }}
                              >
                                <span>{country.flag} {country.name}</span>
                                <span style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>{country.dialCode}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <input
                        type="tel"
                        inputMode="tel"
                        placeholder="Enter phone number"
                        value={phoneNational}
                        onChange={(e) => setPhoneNational(e.target.value)}
                        className={styles.input}
                        style={{ maxWidth: "260px" }}
                      />

                      <button type="submit" className={styles.btnPrimary} disabled={isSavingPhone}>
                        {isSavingPhone ? <SpinnerIcon size={14} /> : <CheckIcon size={14} />}
                        <span>Save Phone</span>
                      </button>
                    </div>

                    {phoneMessage && (
                      <div className={`${styles.feedbackToast} ${phoneMessage.type === "success" ? styles.toastSuccess : styles.toastError}`}>
                        {phoneMessage.type === "success" ? <CheckIcon size={14} /> : <AlertCircleIcon size={14} />}
                        <span>{phoneMessage.text}</span>
                      </div>
                    )}
                  </form>
                </div>

                {/* Connected Accounts */}
                <div className={styles.sectionCard}>
                  <div className={styles.sectionHeader}>
                    <div>
                      <h2 className={styles.sectionHeaderTitle}>Connected OAuth Providers</h2>
                      <p className={styles.sectionHeaderSubtitle}>Sign in faster using enterprise federated single sign-on.</p>
                    </div>
                  </div>

                  <div className={styles.settingRow}>
                    <div className={styles.settingInfo}>
                      <h3 className={styles.settingTitle} style={{ gap: "0.65rem" }}>
                        <GoogleIcon size={18} />
                        <span>Google Workspace Account</span>
                      </h3>
                      <p className={styles.settingDesc}>Connected as {activeUserEmail}</p>
                    </div>
                    <div className={styles.settingControl}>
                      <span className={`${styles.badge} ${styles.badgeSuccess}`}>Connected</span>
                    </div>
                  </div>

                  <div className={styles.settingRow}>
                    <div className={styles.settingInfo}>
                      <h3 className={styles.settingTitle} style={{ gap: "0.65rem" }}>
                        <AppleIcon size={18} />
                        <span>Apple ID</span>
                      </h3>
                      <p className={styles.settingDesc}>Authenticate using Touch ID and Apple Passkeys.</p>
                    </div>
                    <div className={styles.settingControl}>
                      <button type="button" className={styles.btnSecondary} onClick={() => alert("Redirecting to Apple ID authentication flow...")}>
                        Connect Apple
                      </button>
                    </div>
                  </div>
                </div>

                {/* Active Sessions */}
                <div className={styles.sectionCard}>
                  <div className={styles.sectionHeader}>
                    <div>
                      <h2 className={styles.sectionHeaderTitle}>Active Login Sessions</h2>
                      <p className={styles.sectionHeaderSubtitle}>Devices currently authenticated into this OperatSI account.</p>
                    </div>
                    <button type="button" className={styles.btnSecondary} onClick={() => alert("All other active sessions have been revoked.")}>
                      Revoke Other Sessions
                    </button>
                  </div>

                  <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Device / Browser</th>
                          <th>Location</th>
                          <th>IP Address</th>
                          <th>Activity</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ fontWeight: 600 }}>Chrome on Windows 11</td>
                          <td>New York, United States</td>
                          <td>198.51.100.24</td>
                          <td>Active now</td>
                          <td><span className={`${styles.badge} ${styles.badgeSuccess}`}>Current Session</span></td>
                        </tr>
                        <tr>
                          <td style={{ fontWeight: 600 }}>Safari on macOS Sonoma</td>
                          <td>San Francisco, United States</td>
                          <td>192.0.2.14</td>
                          <td>2 hours ago</td>
                          <td><span className={`${styles.badge} ${styles.badgeNeutral}`}>Active</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 3. APPEARANCE */}
            {activeSection === "appearance" && (
              <div>
                <header className={styles.pageHeader}>
                  <div className={styles.pageTitleGroup}>
                    <h1 className={styles.pageTitle}>
                      <PaletteIcon size={20} />
                      <span>Appearance</span>
                    </h1>
                    <p className={styles.pageDescription}>
                      Customize the theme mode, visual density, reduced motion, and interface display preferences.
                    </p>
                  </div>
                </header>

                <div className={styles.sectionCard}>
                  <div className={styles.sectionHeader}>
                    <div>
                      <h2 className={styles.sectionHeaderTitle}>Theme Mode</h2>
                      <p className={styles.sectionHeaderSubtitle}>Select how OperatSI renders across all surfaces and components.</p>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginTop: "1rem" }}>
                    {[
                      { id: "light" as ThemeMode, label: "Light Mode", icon: LightModeIcon, desc: "Crisp, clean high-contrast surfaces" },
                      { id: "dark" as ThemeMode, label: "Dark Mode", icon: DarkModeIcon, desc: "Sophisticated enterprise solid dark" },
                      { id: "system" as ThemeMode, label: "System Default", icon: SystemModeIcon, desc: "Sync with your OS color scheme" },
                    ].map((opt) => {
                      const isSelected = theme === opt.id;
                      const Icon = opt.icon;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          style={{
                            border: isSelected ? "2px solid var(--brand-accent)" : "1px solid var(--card-border)",
                            background: isSelected ? "rgba(37, 99, 235, 0.08)" : "var(--input-bg)",
                            borderRadius: "10px",
                            padding: "1.25rem 1rem",
                            cursor: "pointer",
                            textAlign: "center",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "0.5rem",
                            color: "var(--text-primary)",
                            transition: "all 0.15s ease",
                          }}
                          onClick={() => setTheme(opt.id)}
                        >
                          <div style={{ color: isSelected ? "var(--brand-accent)" : "var(--text-secondary)" }}>
                            <Icon size={24} />
                          </div>
                          <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>{opt.label}</span>
                          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{opt.desc}</span>
                          {isSelected && (
                            <span className={`${styles.badge} ${styles.badgeInfo}`} style={{ marginTop: "0.25rem" }}>
                              <CheckIcon size={11} /> Active
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className={styles.sectionCard}>
                  <div className={styles.sectionHeader}>
                    <div>
                      <h2 className={styles.sectionHeaderTitle}>Interface Preferences</h2>
                      <p className={styles.sectionHeaderSubtitle}>Density, animation parameters, and navigation behavior.</p>
                    </div>
                  </div>

                  <div className={styles.settingRow}>
                    <div className={styles.settingInfo}>
                      <h3 className={styles.settingTitle}>Interface Density</h3>
                      <p className={styles.settingDesc}>Compact density increases information per screen for power analysts.</p>
                    </div>
                    <div className={styles.settingControl}>
                      <CustomSelect
                        value={density}
                        onChange={(val) => setDensity(val as "comfortable" | "compact")}
                        options={DENSITY_OPTIONS}
                        align="right"
                        style={{ minWidth: "220px" }}
                      />
                    </div>
                  </div>

                  <div className={styles.settingRow}>
                    <div className={styles.settingInfo}>
                      <h3 className={styles.settingTitle}>Reduced Motion</h3>
                      <p className={styles.settingDesc}>Minimize animations and transitions across application drawers and cards.</p>
                    </div>
                    <div className={styles.settingControl}>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={reducedMotion}
                        className={`${styles.switch} ${reducedMotion ? styles.switchChecked : ""}`}
                        onClick={() => setReducedMotion((prev) => !prev)}
                      >
                        <span className={styles.switchThumb} />
                      </button>
                    </div>
                  </div>

                  <div className={styles.settingRow}>
                    <div className={styles.settingInfo}>
                      <h3 className={styles.settingTitle}>Auto-collapse Sidebar</h3>
                      <p className={styles.settingDesc}>Automatically compress the global sidebar to icons when width is constrained.</p>
                    </div>
                    <div className={styles.settingControl}>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={autoCollapseSidebar}
                        className={`${styles.switch} ${autoCollapseSidebar ? styles.switchChecked : ""}`}
                        onClick={() => setAutoCollapseSidebar((prev) => !prev)}
                      >
                        <span className={styles.switchThumb} />
                      </button>
                    </div>
                  </div>

                  <div className={styles.settingRow}>
                    <div className={styles.settingInfo}>
                      <h3 className={styles.settingTitle}>Show Unread Badges</h3>
                      <p className={styles.settingDesc}>Display real-time numerical unread badges on Inbox and Execution Center.</p>
                    </div>
                    <div className={styles.settingControl}>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={showUnreadBadges}
                        className={`${styles.switch} ${showUnreadBadges ? styles.switchChecked : ""}`}
                        onClick={() => setShowUnreadBadges((prev) => !prev)}
                      >
                        <span className={styles.switchThumb} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. NOTIFICATIONS */}
            {activeSection === "notifications" && (
              <div>
                <header className={styles.pageHeader}>
                  <div className={styles.pageTitleGroup}>
                    <h1 className={styles.pageTitle}>
                      <BellIcon size={20} />
                      <span>Notifications</span>
                    </h1>
                    <p className={styles.pageDescription}>
                      Configure communication channels and alerts for agent completions, human approvals, and security updates.
                    </p>
                  </div>
                </header>

                <div className={styles.sectionCard}>
                  <div className={styles.sectionHeader}>
                    <div>
                      <h2 className={styles.sectionHeaderTitle}>Delivery Channels</h2>
                      <p className={styles.sectionHeaderSubtitle}>Control how OperatSI routes high-priority notifications to you.</p>
                    </div>
                  </div>

                  <div className={styles.settingRow}>
                    <div className={styles.settingInfo}>
                      <h3 className={styles.settingTitle}>Email Notifications</h3>
                      <p className={styles.settingDesc}>Receive critical alerts and approval summaries at {activeUserEmail}.</p>
                    </div>
                    <div className={styles.settingControl}>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={emailAlerts}
                        className={`${styles.switch} ${emailAlerts ? styles.switchChecked : ""}`}
                        onClick={() => setEmailAlerts((prev) => !prev)}
                      >
                        <span className={styles.switchThumb} />
                      </button>
                    </div>
                  </div>

                  <div className={styles.settingRow}>
                    <div className={styles.settingInfo}>
                      <h3 className={styles.settingTitle}>In-App Activity Bell</h3>
                      <p className={styles.settingDesc}>Show badges and notification drawers inside the OperatSI top navigation.</p>
                    </div>
                    <div className={styles.settingControl}>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={inAppAlerts}
                        className={`${styles.switch} ${inAppAlerts ? styles.switchChecked : ""}`}
                        onClick={() => setInAppAlerts((prev) => !prev)}
                      >
                        <span className={styles.switchThumb} />
                      </button>
                    </div>
                  </div>

                  <div className={styles.settingRow}>
                    <div className={styles.settingInfo}>
                      <h3 className={styles.settingTitle}>Desktop Browser Push</h3>
                      <p className={styles.settingDesc}>Instant OS push alerts when background agent executions require human input.</p>
                    </div>
                    <div className={styles.settingControl}>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={browserAlerts}
                        className={`${styles.switch} ${browserAlerts ? styles.switchChecked : ""}`}
                        onClick={() => setBrowserAlerts((prev) => !prev)}
                      >
                        <span className={styles.switchThumb} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className={styles.sectionCard}>
                  <div className={styles.sectionHeader}>
                    <div>
                      <h2 className={styles.sectionHeaderTitle}>Event Subscriptions</h2>
                      <p className={styles.sectionHeaderSubtitle}>Granularly select which events dispatch alerts.</p>
                    </div>
                  </div>

                  <div className={styles.settingRow}>
                    <div className={styles.settingInfo}>
                      <h3 className={styles.settingTitle}>Task Assignments &amp; Mentions</h3>
                      <p className={styles.settingDesc}>When team members delegate tasks or reference your identity.</p>
                    </div>
                    <div className={styles.settingControl}>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={taskAlerts}
                        className={`${styles.switch} ${taskAlerts ? styles.switchChecked : ""}`}
                        onClick={() => setTaskAlerts((prev) => !prev)}
                      >
                        <span className={styles.switchThumb} />
                      </button>
                    </div>
                  </div>

                  <div className={styles.settingRow}>
                    <div className={styles.settingInfo}>
                      <h3 className={styles.settingTitle}>Nano Agent Run Completions</h3>
                      <p className={styles.settingDesc}>Status updates when autonomous scrapers or workflows succeed or fail.</p>
                    </div>
                    <div className={styles.settingControl}>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={agentAlerts}
                        className={`${styles.switch} ${agentAlerts ? styles.switchChecked : ""}`}
                        onClick={() => setAgentAlerts((prev) => !prev)}
                      >
                        <span className={styles.switchThumb} />
                      </button>
                    </div>
                  </div>

                  <div className={styles.settingRow}>
                    <div className={styles.settingInfo}>
                      <h3 className={styles.settingTitle}>Human-in-the-Loop Approvals</h3>
                      <p className={styles.settingDesc}>Urgent notifications when an execution pauses waiting for your signature.</p>
                    </div>
                    <div className={styles.settingControl}>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={approvalAlerts}
                        className={`${styles.switch} ${approvalAlerts ? styles.switchChecked : ""}`}
                        onClick={() => setApprovalAlerts((prev) => !prev)}
                      >
                        <span className={styles.switchThumb} />
                      </button>
                    </div>
                  </div>

                  <div className={styles.settingRow}>
                    <div className={styles.settingInfo}>
                      <h3 className={styles.settingTitle}>Workspace Invitations</h3>
                      <p className={styles.settingDesc}>Alerts when new collaborators accept invitations or change roles.</p>
                    </div>
                    <div className={styles.settingControl}>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={inviteAlerts}
                        className={`${styles.switch} ${inviteAlerts ? styles.switchChecked : ""}`}
                        onClick={() => setInviteAlerts((prev) => !prev)}
                      >
                        <span className={styles.switchThumb} />
                      </button>
                    </div>
                  </div>

                  <div className={styles.settingRow}>
                    <div className={styles.settingInfo}>
                      <h3 className={styles.settingTitle}>Security &amp; Compliance Notifications</h3>
                      <p className={styles.settingDesc}>Mandatory notices on new IP logins, API key generation, or policy edits.</p>
                    </div>
                    <div className={styles.settingControl}>
                      <span className={`${styles.badge} ${styles.badgeInfo}`} title="Mandatory for SOC2 compliance">
                        Mandatory
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 5. GENERAL (WORKSPACE) */}
            {activeSection === "general" && (
              <div>
                <header className={styles.pageHeader}>
                  <div className={styles.pageTitleGroup}>
                    <h1 className={styles.pageTitle}>
                      <BuildingIcon size={20} />
                      <span>General Workspace Settings</span>
                    </h1>
                    <p className={styles.pageDescription}>
                      Configure your workspace name, organizational identifiers, legal jurisdiction, and data residency region.
                    </p>
                  </div>
                </header>

                <div className={styles.sectionCard}>
                  <div className={styles.sectionHeader}>
                    <div>
                      <h2 className={styles.sectionHeaderTitle}>Workspace Identity</h2>
                      <p className={styles.sectionHeaderSubtitle}>Primary identifiers for team routing and API integrations.</p>
                    </div>
                  </div>

                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Workspace Name</label>
                      <input
                        type="text"
                        className={styles.input}
                        value={workspaceName}
                        onChange={(e) => setWorkspaceName(e.target.value)}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Workspace Slug / Identifier</label>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <input
                          type="text"
                          className={`${styles.input} ${styles.lockedInput}`}
                          value={workspaceSlug}
                          readOnly
                        />
                        <button type="button" className={styles.btnSecondary} onClick={handleCopySlug} title="Copy Workspace Identifier">
                          {isCopiedSlug ? <CheckIcon size={14} style={{ color: "var(--status-green)" }} /> : <CopyIcon size={14} />}
                        </button>
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Industry Sector</label>
                      <CustomSelect
                        value={industry}
                        onChange={(val) => setIndustry(val)}
                        options={INDUSTRY_OPTIONS}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Organization Size</label>
                      <CustomSelect
                        value={companySize}
                        onChange={(val) => setCompanySize(val)}
                        options={COMPANY_SIZE_OPTIONS}
                      />
                    </div>

                    <div className={`${styles.formGroup} ${styles.formGridFull}`}>
                      <label className={styles.formLabel}>Data Residency Region</label>
                      <CustomSelect
                        value={dataRegion}
                        onChange={(val) => setDataRegion(val)}
                        options={DATA_REGION_OPTIONS}
                      />
                      <span className={styles.formHint}>Encrypted at rest with AES-256 and customer-managed keys (CMEK).</span>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "0.5rem" }}>
                    <button
                      type="button"
                      className={styles.btnPrimary}
                      onClick={() => {
                        setWorkspaceFeedback("Workspace configurations saved.");
                        setTimeout(() => setWorkspaceFeedback(null), 3000);
                      }}
                    >
                      <CheckIcon size={14} />
                      <span>Save Workspace Settings</span>
                    </button>
                  </div>

                  {workspaceFeedback && (
                    <div className={`${styles.feedbackToast} ${styles.toastSuccess}`}>
                      <CheckIcon size={14} />
                      <span>{workspaceFeedback}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 6. MEMBERS & ROLES */}
            {activeSection === "members" && (
              <div>
                <header className={styles.pageHeader}>
                  <div className={styles.pageTitleGroup}>
                    <h1 className={styles.pageTitle}>
                      <TeamIcon size={20} />
                      <span>Members &amp; Roles</span>
                    </h1>
                    <p className={styles.pageDescription}>
                      Manage workspace members, grant role-based access permissions, and issue invitation links.
                    </p>
                  </div>
                  <div className={styles.pageHeaderAction}>
                    <button type="button" className={styles.btnPrimary} onClick={() => setIsInviteModalOpen(true)}>
                      <TeamIcon size={14} />
                      <span>Invite Member</span>
                    </button>
                  </div>
                </header>

                <div className={styles.sectionCard}>
                  <div className={styles.sectionHeader}>
                    <div>
                      <h2 className={styles.sectionHeaderTitle}>Active Workspace Members ({membersList.length})</h2>
                      <p className={styles.sectionHeaderSubtitle}>All users with authenticated access to this workspace environment.</p>
                    </div>
                  </div>

                  <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Member</th>
                          <th>Role</th>
                          <th>Status</th>
                          <th>Last Active</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {membersList.map((member) => (
                          <tr key={member.id}>
                            <td>
                              <div style={{ display: "flex", flexDirection: "column" }}>
                                <span style={{ fontWeight: 600 }}>{member.name}</span>
                                <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>{member.email}</span>
                              </div>
                            </td>
                            <td>
                              <span
                                className={`${styles.badge} ${
                                  member.role === "Owner"
                                    ? styles.badgeDanger
                                    : member.role === "Admin"
                                    ? styles.badgeInfo
                                    : styles.badgeNeutral
                                }`}
                              >
                                {member.role}
                              </span>
                            </td>
                            <td>
                              <span className={`${styles.badge} ${styles.badgeSuccess}`}>
                                <CheckIcon size={11} /> {member.status}
                              </span>
                            </td>
                            <td style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>{member.lastActive}</td>
                            <td>
                              {member.role !== "Owner" && (
                                <button
                                  type="button"
                                  className={styles.btnSecondary}
                                  style={{ padding: "0.25rem 0.5rem", fontSize: "0.72rem" }}
                                  onClick={() => {
                                    if (confirm(`Remove ${member.name} from workspace?`)) {
                                      setMembersList((prev) => prev.filter((m) => m.id !== member.id));
                                    }
                                  }}
                                >
                                  Remove
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Role Permissions Reference */}
                <div className={styles.sectionCard}>
                  <div className={styles.sectionHeader}>
                    <div>
                      <h2 className={styles.sectionHeaderTitle}>Role Permissions Matrix</h2>
                      <p className={styles.sectionHeaderSubtitle}>Summary of platform authorizations across defined RBAC tiers.</p>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem" }}>
                    <div style={{ padding: "1rem", border: "1px solid var(--card-border)", borderRadius: "8px" }}>
                      <span className={`${styles.badge} ${styles.badgeDanger}`}>Owner / Admin</span>
                      <p style={{ fontSize: "0.785rem", color: "var(--text-secondary)", marginTop: "0.5rem", lineHeight: 1.45 }}>
                        Full access to billing, AI spend policies, security keys, member invitations, danger zone operations, and compliance logs.
                      </p>
                    </div>

                    <div style={{ padding: "1rem", border: "1px solid var(--card-border)", borderRadius: "8px" }}>
                      <span className={`${styles.badge} ${styles.badgeNeutral}`}>Member / Viewer</span>
                      <p style={{ fontSize: "0.785rem", color: "var(--text-secondary)", marginTop: "0.5rem", lineHeight: 1.45 }}>
                        Execute assigned Nano Agents, submit workflows for human approval, view CRM pipelines, and query authorized knowledge bases.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Invite Member Modal */}
                {isInviteModalOpen && (
                  <div className={styles.modalOverlay} onClick={() => setIsInviteModalOpen(false)}>
                    <div className={styles.modalDialog} onClick={(e) => e.stopPropagation()}>
                      <div className={styles.modalHeader}>
                        <div style={{ flex: 1 }}>
                          <h3 className={styles.modalTitle}>Invite Workspace Collaborator</h3>
                          <p className={styles.modalSubtitle}>Send a secure email invitation with pre-configured role permissions.</p>
                        </div>
                        <button type="button" onClick={() => setIsInviteModalOpen(false)} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
                          <CloseIcon size={18} />
                        </button>
                      </div>

                      <div className={styles.modalBody}>
                        <div className={styles.formGroup} style={{ marginBottom: "1rem" }}>
                          <label className={styles.formLabel}>Collaborator Email</label>
                          <input
                            type="email"
                            placeholder="colleague@company.com"
                            className={styles.input}
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            autoFocus
                          />
                        </div>

                        <div className={styles.formGroup}>
                          <label className={styles.formLabel}>Assigned Role</label>
                          <CustomSelect
                            value={inviteRole}
                            onChange={(val) => setInviteRole(val)}
                            options={INVITE_ROLE_OPTIONS}
                          />
                        </div>
                      </div>

                      <div className={styles.modalFooter}>
                        <button type="button" className={styles.btnSecondary} onClick={() => setIsInviteModalOpen(false)}>
                          Cancel
                        </button>
                        <button
                          type="button"
                          className={styles.btnPrimary}
                          onClick={() => {
                            if (!inviteEmail) return alert("Please enter an email address.");
                            setMembersList((prev) => [
                              ...prev,
                              {
                                id: String(Date.now()),
                                name: inviteEmail.split("@")[0],
                                email: inviteEmail,
                                role: inviteRole,
                                status: "Active",
                                lastActive: "Invited now",
                              },
                            ]);
                            setIsInviteModalOpen(false);
                            setInviteEmail("");
                          }}
                        >
                          Send Invitation
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 7. DEPARTMENTS */}
            {activeSection === "departments" && (
              <div>
                <header className={styles.pageHeader}>
                  <div className={styles.pageTitleGroup}>
                    <h1 className={styles.pageTitle}>
                      <LayersIcon size={20} />
                      <span>Departments</span>
                    </h1>
                    <p className={styles.pageDescription}>
                      Organize your enterprise workspace into isolated functional departments with dedicated managers and resource pools.
                    </p>
                  </div>
                  <div className={styles.pageHeaderAction}>
                    <button type="button" className={styles.btnPrimary} onClick={() => alert("Department creation dialog opened.")}>
                      <LayersIcon size={14} />
                      <span>Create Department</span>
                    </button>
                  </div>
                </header>

                <div className={styles.sectionCard}>
                  <div className={styles.sectionHeader}>
                    <div>
                      <h2 className={styles.sectionHeaderTitle}>Organizational Units (5)</h2>
                      <p className={styles.sectionHeaderSubtitle}>Functional groups with segregated task backlogs and workflow triggers.</p>
                    </div>
                  </div>

                  <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Department</th>
                          <th>Department Lead</th>
                          <th>Assigned Members</th>
                          <th>Access Policy</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ fontWeight: 600 }}>Engineering &amp; Infrastructure</td>
                          <td>Sarah Jenkins</td>
                          <td>14 Members</td>
                          <td>Production &amp; Sandboxes</td>
                          <td><span className={`${styles.badge} ${styles.badgeSuccess}`}>Active</span></td>
                        </tr>
                        <tr>
                          <td style={{ fontWeight: 600 }}>Autonomous Operations</td>
                          <td>Alex Rivera</td>
                          <td>8 Members</td>
                          <td>Agent Fleet &amp; Scraping</td>
                          <td><span className={`${styles.badge} ${styles.badgeSuccess}`}>Active</span></td>
                        </tr>
                        <tr>
                          <td style={{ fontWeight: 600 }}>Sales &amp; CRM Pipeline</td>
                          <td>David Chen</td>
                          <td>12 Members</td>
                          <td>Lead Ingestion &amp; Deals</td>
                          <td><span className={`${styles.badge} ${styles.badgeSuccess}`}>Active</span></td>
                        </tr>
                        <tr>
                          <td style={{ fontWeight: 600 }}>Security &amp; Compliance</td>
                          <td>Elena Rostova</td>
                          <td>5 Members</td>
                          <td>Audit &amp; Identity Logs</td>
                          <td><span className={`${styles.badge} ${styles.badgeSuccess}`}>Active</span></td>
                        </tr>
                        <tr>
                          <td style={{ fontWeight: 600 }}>Product &amp; Strategy</td>
                          <td>Krishanth B</td>
                          <td>6 Members</td>
                          <td>Planning &amp; Roadmaps</td>
                          <td><span className={`${styles.badge} ${styles.badgeSuccess}`}>Active</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 8. INTEGRATIONS */}
            {activeSection === "integrations" && (
              <div>
                <header className={styles.pageHeader}>
                  <div className={styles.pageTitleGroup}>
                    <h1 className={styles.pageTitle}>
                      <IntegrationsIcon size={20} />
                      <span>Integrations</span>
                    </h1>
                    <p className={styles.pageDescription}>
                      Connect enterprise APIs, webhooks, and third-party tools to empower your autonomous Nano Agents.
                    </p>
                  </div>
                </header>

                <div className={styles.sectionCard}>
                  <div className={styles.sectionHeader}>
                    <div>
                      <h2 className={styles.sectionHeaderTitle}>Connected Cloud Ecosystem</h2>
                      <p className={styles.sectionHeaderSubtitle}>Bi-directional synchronization bridges active across your workspace.</p>
                    </div>
                  </div>

                  <div className={styles.integrationGrid}>
                    {[
                      { name: "Slack Enterprise", category: "Communications", desc: "Real-time #operatsi-alerts channel routing", status: "Connected" },
                      { name: "GitHub Cloud", category: "Developer Tools", desc: "OperatSI/operatsi-platform CI/CD and pull requests", status: "Connected" },
                      { name: "Google Workspace", category: "Productivity", desc: "Google Drive, Docs, and Calendar synchronization", status: "Connected" },
                      { name: "Salesforce CRM", category: "Sales & Pipeline", desc: "Bi-directional lead enrichment and deal sync", status: "Connected" },
                      { name: "Notion Workspaces", category: "Knowledge Base", desc: "Sync company wikis into agent vector memories", status: "Available" },
                      { name: "AWS CloudWatch", category: "Cloud & Telemetry", desc: "Stream execution audit logs directly into Amazon S3", status: "Available" },
                    ].map((app) => (
                      <div key={app.name} className={styles.integrationCard}>
                        <div>
                          <div className={styles.integrationHeader}>
                            <div className={styles.integrationLogo}>{app.name.charAt(0)}</div>
                            <div className={styles.integrationMeta}>
                              <h3 className={styles.integrationName}>{app.name}</h3>
                              <p className={styles.integrationCategory}>{app.category}</p>
                            </div>
                          </div>
                          <p style={{ fontSize: "0.76rem", color: "var(--text-secondary)", marginTop: "0.65rem", lineHeight: 1.4 }}>
                            {app.desc}
                          </p>
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "0.5rem", borderTop: "1px solid var(--divider-color)" }}>
                          <span className={`${styles.badge} ${app.status === "Connected" ? styles.badgeSuccess : styles.badgeNeutral}`}>
                            {app.status}
                          </span>
                          <button
                            type="button"
                            className={app.status === "Connected" ? styles.btnSecondary : styles.btnPrimary}
                            style={{ padding: "0.35rem 0.65rem", fontSize: "0.74rem" }}
                            onClick={() => alert(`${app.name} settings updated.`)}
                          >
                            {app.status === "Connected" ? "Configure" : "Connect"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 9. AI PREFERENCES */}
            {activeSection === "ai-preferences" && (
              <div>
                <header className={styles.pageHeader}>
                  <div className={styles.pageTitleGroup}>
                    <h1 className={styles.pageTitle}>
                      <OperatsiAiIcon size={20} />
                      <span>AI Preferences</span>
                    </h1>
                    <p className={styles.pageDescription}>
                      Configure default LLM reasoning models, response verbosity, contextual memory windows, and data boundaries.
                    </p>
                  </div>
                </header>

                <div className={styles.sectionCard}>
                  <div className={styles.sectionHeader}>
                    <div>
                      <h2 className={styles.sectionHeaderTitle}>Reasoning Engine Configuration</h2>
                      <p className={styles.sectionHeaderSubtitle}>Default foundation models and latency routing strategies.</p>
                    </div>
                  </div>

                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Default AI Model</label>
                      <CustomSelect
                        value={defaultAiModel}
                        onChange={(val) => setDefaultAiModel(val)}
                        options={AI_MODEL_OPTIONS}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Response Style &amp; Verbosity</label>
                      <CustomSelect
                        value={aiStyle}
                        onChange={(val) => setAiStyle(val)}
                        options={AI_STYLE_OPTIONS}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>
                        <span>Context Window Horizon</span>
                        <span className={styles.formHint}>{contextTokens}k Tokens</span>
                      </label>
                      <input
                        type="range"
                        min="16"
                        max="128"
                        step="16"
                        value={contextTokens}
                        onChange={(e) => setContextTokens(Number(e.target.value))}
                        style={{ width: "100%", accentColor: "var(--brand-accent)" }}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>
                        <span>Monthly AI Spend Limit</span>
                        <span className={styles.formHint}>${monthlyTokenCap} USD</span>
                      </label>
                      <input
                        type="range"
                        min="100"
                        max="2000"
                        step="100"
                        value={monthlyTokenCap}
                        onChange={(e) => setMonthlyTokenCap(Number(e.target.value))}
                        style={{ width: "100%", accentColor: "var(--brand-accent)" }}
                      />
                    </div>
                  </div>

                  <div className={styles.settingRow} style={{ marginTop: "1rem" }}>
                    <div className={styles.settingInfo}>
                      <h3 className={styles.settingTitle}>Automatic PII &amp; Secret Redaction</h3>
                      <p className={styles.settingDesc}>
                        Scrub API keys, passwords, credit card numbers, and patient data before transmitting prompt payloads to AI providers.
                      </p>
                    </div>
                    <div className={styles.settingControl}>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={piiRedaction}
                        className={`${styles.switch} ${piiRedaction ? styles.switchChecked : ""}`}
                        onClick={() => setPiiRedaction((prev) => !prev)}
                      >
                        <span className={styles.switchThumb} />
                      </button>
                    </div>
                  </div>

                  <div className={styles.settingRow}>
                    <div className={styles.settingInfo}>
                      <h3 className={styles.settingTitle}>Zero Data Retention (ZDR) SLA</h3>
                      <p className={styles.settingDesc}>All LLM provider queries operate under strict enterprise agreements preventing training on your data.</p>
                    </div>
                    <div className={styles.settingControl}>
                      <span className={`${styles.badge} ${styles.badgeSuccess}`}>
                        <CheckIcon size={12} /> Active SLA
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 10. NANO AGENTS */}
            {activeSection === "nano-agents" && (
              <div>
                <header className={styles.pageHeader}>
                  <div className={styles.pageTitleGroup}>
                    <h1 className={styles.pageTitle}>
                      <NanoAgentsIcon size={20} />
                      <span>Nano Agents Configuration</span>
                    </h1>
                    <p className={styles.pageDescription}>
                      Manage runtime concurrency limits, execution timeouts, sandboxing policies, and tool permissions.
                    </p>
                  </div>
                </header>

                <div className={styles.sectionCard}>
                  <div className={styles.sectionHeader}>
                    <div>
                      <h2 className={styles.sectionHeaderTitle}>Cluster Concurrency &amp; Lifecycle</h2>
                      <p className={styles.sectionHeaderSubtitle}>Execution bounds enforced across all autonomous nano-agent jobs.</p>
                    </div>
                  </div>

                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>
                        <span>Concurrent Agent Fleet Limit</span>
                        <span className={styles.formHint}>{concurrentAgents} Active Workers</span>
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="25"
                        value={concurrentAgents}
                        onChange={(e) => setConcurrentAgents(Number(e.target.value))}
                        style={{ width: "100%", accentColor: "var(--brand-accent)" }}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>
                        <span>Job Execution Timeout</span>
                        <span className={styles.formHint}>{agentTimeout} Seconds</span>
                      </label>
                      <input
                        type="range"
                        min="60"
                        max="600"
                        step="30"
                        value={agentTimeout}
                        onChange={(e) => setAgentTimeout(Number(e.target.value))}
                        style={{ width: "100%", accentColor: "var(--brand-accent)" }}
                      />
                    </div>
                  </div>

                  <div className={styles.settingRow} style={{ marginTop: "1rem" }}>
                    <div className={styles.settingInfo}>
                      <h3 className={styles.settingTitle}>Auto-Retry on Transient Network Faults</h3>
                      <p className={styles.settingDesc}>Retry agent steps up to 3 times with exponential backoff on HTTP 429/503 errors.</p>
                    </div>
                    <div className={styles.settingControl}>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={autoRetry}
                        className={`${styles.switch} ${autoRetry ? styles.switchChecked : ""}`}
                        onClick={() => setAutoRetry((prev) => !prev)}
                      >
                        <span className={styles.switchThumb} />
                      </button>
                    </div>
                  </div>

                  <div className={styles.settingRow}>
                    <div className={styles.settingInfo}>
                      <h3 className={styles.settingTitle}>Strict Docker Container Sandboxing</h3>
                      <p className={styles.settingDesc}>Isolate every code execution job in an ephemeral container with no local network access.</p>
                    </div>
                    <div className={styles.settingControl}>
                      <span className={`${styles.badge} ${styles.badgeSuccess}`}>Enforced</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 11. CLOUD BROWSER */}
            {activeSection === "cloud-browser" && (
              <div>
                <header className={styles.pageHeader}>
                  <div className={styles.pageTitleGroup}>
                    <h1 className={styles.pageTitle}>
                      <CloudBrowserIcon size={20} />
                      <span>Cloud Browser</span>
                    </h1>
                    <p className={styles.pageDescription}>
                      Configure isolated Chromium browser container fleets, domain whitelists, recording retention, and download policies.
                    </p>
                  </div>
                </header>

                <div className={styles.sectionCard}>
                  <div className={styles.sectionHeader}>
                    <div>
                      <h2 className={styles.sectionHeaderTitle}>Browser Fleet Settings</h2>
                      <p className={styles.sectionHeaderSubtitle}>Virtual desktop environments for autonomous web agents.</p>
                    </div>
                  </div>

                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Concurrent Browser Containers</label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        className={styles.input}
                        value={concurrentBrowsers}
                        onChange={(e) => setConcurrentBrowsers(Number(e.target.value))}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Browser User-Agent Persona</label>
                      <CustomSelect
                        value={browserPersona}
                        onChange={(val) => setBrowserPersona(val)}
                        options={BROWSER_PERSONA_OPTIONS}
                      />
                    </div>

                    <div className={`${styles.formGroup} ${styles.formGridFull}`}>
                      <label className={styles.formLabel}>Domain Access Whitelist (One per line)</label>
                      <textarea
                        rows={3}
                        className={styles.textarea}
                        defaultValue={"*.google.com\n*.github.com\n*.salesforce.com\n*.linkedin.com"}
                      />
                      <span className={styles.formHint}>Agents are strictly blocked from loading domains outside this whitelist.</span>
                    </div>
                  </div>

                  <div className={styles.settingRow}>
                    <div className={styles.settingInfo}>
                      <h3 className={styles.settingTitle}>Encrypted Video &amp; Screenshot Retention</h3>
                      <p className={styles.settingDesc}>Capture run recordings and store encrypted at rest for 30 days for compliance audits.</p>
                    </div>
                    <div className={styles.settingControl}>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={recordSessions}
                        className={`${styles.switch} ${recordSessions ? styles.switchChecked : ""}`}
                        onClick={() => setRecordSessions((prev) => !prev)}
                      >
                        <span className={styles.switchThumb} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 12. APPROVALS */}
            {activeSection === "approvals" && (
              <div>
                <header className={styles.pageHeader}>
                  <div className={styles.pageTitleGroup}>
                    <h1 className={styles.pageTitle}>
                      <TasksCheckIcon size={20} />
                      <span>Human-in-the-Loop Approvals</span>
                    </h1>
                    <p className={styles.pageDescription}>
                      Enforce verification gates for high-impact autonomous actions such as database mutations, payments, and production deployments.
                    </p>
                  </div>
                </header>

                <div className={styles.sectionCard}>
                  <div className={styles.sectionHeader}>
                    <div>
                      <h2 className={styles.sectionHeaderTitle}>Mandatory Approval Policies</h2>
                      <p className={styles.sectionHeaderSubtitle}>Actions requiring explicit human signatures prior to execution.</p>
                    </div>
                  </div>

                  <div className={styles.settingRow}>
                    <div className={styles.settingInfo}>
                      <h3 className={styles.settingTitle}>Production Code Deployment</h3>
                      <p className={styles.settingDesc}>Requires approval from at least 2 Engineering Leads before pushing container updates.</p>
                    </div>
                    <div className={styles.settingControl}>
                      <span className={`${styles.badge} ${styles.badgeDanger}`}>2 Approvers Required</span>
                    </div>
                  </div>

                  <div className={styles.settingRow}>
                    <div className={styles.settingInfo}>
                      <h3 className={styles.settingTitle}>CRM Pipeline Bulk Updates</h3>
                      <p className={styles.settingDesc}>Requires approval from a Sales Manager when altering &gt; 50 customer accounts.</p>
                    </div>
                    <div className={styles.settingControl}>
                      <span className={`${styles.badge} ${styles.badgeWarning}`}>1 Approver Required</span>
                    </div>
                  </div>

                  <div className={styles.settingRow}>
                    <div className={styles.settingInfo}>
                      <h3 className={styles.settingTitle}>Billing &amp; Subscription Changes</h3>
                      <p className={styles.settingDesc}>Restricted exclusively to the primary Workspace Owner.</p>
                    </div>
                    <div className={styles.settingControl}>
                      <span className={`${styles.badge} ${styles.badgeInfo}`}>Owner Only</span>
                    </div>
                  </div>

                  <div style={{ marginTop: "1.25rem", padding: "0.85rem", background: "rgba(37,99,235,0.06)", border: "1px solid rgba(37,99,235,0.2)", borderRadius: "8px", fontSize: "0.785rem", color: "var(--text-secondary)" }}>
                    <strong>Enterprise Compliance Notice:</strong> Mandatory security approvals cannot be bypassed by standard user preferences or agent prompt overrides.
                  </div>
                </div>
              </div>
            )}

            {/* 13. SECURITY */}
            {activeSection === "security" && (
              <div>
                <header className={styles.pageHeader}>
                  <div className={styles.pageTitleGroup}>
                    <h1 className={styles.pageTitle}>
                      <ShieldCheckIcon size={20} />
                      <span>Security &amp; Compliance</span>
                    </h1>
                    <p className={styles.pageDescription}>
                      Configure multi-factor authentication, enterprise SSO/SAML, IP allowlists, and cryptographic API tokens.
                    </p>
                  </div>
                </header>

                <div className={styles.sectionCard}>
                  <div className={styles.sectionHeader}>
                    <div>
                      <h2 className={styles.sectionHeaderTitle}>Authentication Policies</h2>
                      <p className={styles.sectionHeaderSubtitle}>Enforce enterprise baseline security standards for all workspace members.</p>
                    </div>
                  </div>

                  <div className={styles.settingRow}>
                    <div className={styles.settingInfo}>
                      <h3 className={styles.settingTitle}>Enforce Multi-Factor Authentication (MFA)</h3>
                      <p className={styles.settingDesc}>Require all members to authenticate with a TOTP authenticator app or hardware security key.</p>
                    </div>
                    <div className={styles.settingControl}>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={mfaEnforced}
                        className={`${styles.switch} ${mfaEnforced ? styles.switchChecked : ""}`}
                        onClick={() => setMfaEnforced((prev) => !prev)}
                      >
                        <span className={styles.switchThumb} />
                      </button>
                    </div>
                  </div>

                  <div className={styles.settingRow}>
                    <div className={styles.settingInfo}>
                      <h3 className={styles.settingTitle}>Session Expiration Timeout</h3>
                      <p className={styles.settingDesc}>Automatically terminate idle sessions after 8 hours of inactivity.</p>
                    </div>
                    <div className={styles.settingControl}>
                      <span className={`${styles.badge} ${styles.badgeNeutral}`}>8 Hours (Standard)</span>
                    </div>
                  </div>

                  <div className={styles.settingRow}>
                    <div className={styles.settingInfo}>
                      <h3 className={styles.settingTitle}>Production API Secret Key</h3>
                      <p className={styles.settingDesc}>Used by external services and webhooks to trigger OperatSI workflows.</p>
                    </div>
                    <div className={styles.settingControl}>
                      <button
                        type="button"
                        className={styles.btnSecondary}
                        onClick={() => {
                          navigator.clipboard.writeText("opsi_live_9837492817491029481");
                          setApiKeyCopied(true);
                          setTimeout(() => setApiKeyCopied(false), 2000);
                        }}
                      >
                        {apiKeyCopied ? <CheckIcon size={14} style={{ color: "var(--status-green)" }} /> : <CopyIcon size={14} />}
                        <span>{apiKeyCopied ? "Copied" : "Copy Key"}</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className={styles.sectionCard}>
                  <div className={styles.sectionHeader}>
                    <div>
                      <h2 className={styles.sectionHeaderTitle}>Compliance Attestations</h2>
                      <p className={styles.sectionHeaderSubtitle}>Continuous independent security certifications.</p>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: "220px", padding: "1rem", border: "1px solid var(--card-border)", borderRadius: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
                        <span className={`${styles.badge} ${styles.badgeSuccess}`}>Verified</span>
                        <strong style={{ fontSize: "0.85rem" }}>SOC2 Type II Certified</strong>
                      </div>
                      <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0 }}>
                        Annual audit covering security, availability, and confidential data processing.
                      </p>
                    </div>

                    <div style={{ flex: 1, minWidth: "220px", padding: "1rem", border: "1px solid var(--card-border)", borderRadius: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
                        <span className={`${styles.badge} ${styles.badgeSuccess}`}>Compliant</span>
                        <strong style={{ fontSize: "0.85rem" }}>ISO/IEC 27001</strong>
                      </div>
                      <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0 }}>
                        Enterprise information security management standards strictly enforced.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 14. DATA & PRIVACY */}
            {activeSection === "data-privacy" && (
              <div>
                <header className={styles.pageHeader}>
                  <div className={styles.pageTitleGroup}>
                    <h1 className={styles.pageTitle}>
                      <DatabaseIcon size={20} />
                      <span>Data &amp; Privacy</span>
                    </h1>
                    <p className={styles.pageDescription}>
                      Manage workspace data export, GDPR/CCPA personal data requests, retention policies, and zero-training guarantees.
                    </p>
                  </div>
                </header>

                <div className={styles.sectionCard}>
                  <div className={styles.sectionHeader}>
                    <div>
                      <h2 className={styles.sectionHeaderTitle}>Data Export &amp; Portability</h2>
                      <p className={styles.sectionHeaderSubtitle}>Download a complete JSON and CSV archive of all workspace records and agent histories.</p>
                    </div>
                  </div>

                  <div className={styles.settingRow}>
                    <div className={styles.settingInfo}>
                      <h3 className={styles.settingTitle}>Export Workspace Archive</h3>
                      <p className={styles.settingDesc}>
                        Includes profile details, task backlogs, CRM deal records, agent execution logs, and telemetry metrics.
                      </p>
                    </div>
                    <div className={styles.settingControl}>
                      <button type="button" className={styles.btnPrimary} onClick={handleExportData}>
                        <DownloadIcon size={14} />
                        <span>Export All Data (JSON)</span>
                      </button>
                    </div>
                  </div>

                  <div className={styles.settingRow}>
                    <div className={styles.settingInfo}>
                      <h3 className={styles.settingTitle}>GDPR / CCPA Subject Access Request</h3>
                      <p className={styles.settingDesc}>Request an official compliance data disclosure for personal data tied to {activeUserEmail}.</p>
                    </div>
                    <div className={styles.settingControl}>
                      <button type="button" className={styles.btnSecondary} onClick={() => alert("Data disclosure report dispatched to your verified email.")}>
                        Request Report
                      </button>
                    </div>
                  </div>
                </div>

                <div className={styles.sectionCard}>
                  <div className={styles.sectionHeader}>
                    <div>
                      <h2 className={styles.sectionHeaderTitle}>Data Retention Schedules</h2>
                      <p className={styles.sectionHeaderSubtitle}>Automated purging schedules to minimize corporate data exposure.</p>
                    </div>
                  </div>

                  <div className={styles.settingRow}>
                    <div className={styles.settingInfo}>
                      <h3 className={styles.settingTitle}>Audit Log Retention</h3>
                      <p className={styles.settingDesc}>Duration audit records are retained before automated cold storage archiving.</p>
                    </div>
                    <div className={styles.settingControl}>
                      <CustomSelect
                        value={auditRetention}
                        onChange={(val) => setAuditRetention(val)}
                        options={AUDIT_RETENTION_OPTIONS}
                        align="right"
                        style={{ minWidth: "170px" }}
                      />
                    </div>
                  </div>

                  <div className={styles.settingRow}>
                    <div className={styles.settingInfo}>
                      <h3 className={styles.settingTitle}>Agent Execution Traces</h3>
                      <p className={styles.settingDesc}>Step-by-step console logs and screenshots generated during web tasks.</p>
                    </div>
                    <div className={styles.settingControl}>
                      <CustomSelect
                        value={agentRetention}
                        onChange={(val) => setAgentRetention(val)}
                        options={AGENT_RETENTION_OPTIONS}
                        align="right"
                        style={{ minWidth: "170px" }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 15. BILLING & USAGE */}
            {activeSection === "billing" && (
              <div>
                <header className={styles.pageHeader}>
                  <div className={styles.pageTitleGroup}>
                    <h1 className={styles.pageTitle}>
                      <BillingIcon size={20} />
                      <span>Billing &amp; Usage</span>
                    </h1>
                    <p className={styles.pageDescription}>
                      Manage your subscription plan, real-time compute resource consumption, payment methods, and invoices.
                    </p>
                  </div>
                </header>

                <div className={styles.sectionCard}>
                  <div className={styles.sectionHeader}>
                    <div>
                      <h2 className={styles.sectionHeaderTitle}>Current Subscription Plan</h2>
                      <p className={styles.sectionHeaderSubtitle}>Active billing agreement and entitlement quotas.</p>
                    </div>
                    <span className={`${styles.badge} ${styles.badgeSuccess}`}>Active Plan</span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                    <div>
                      <h3 style={{ fontSize: "1.3rem", fontWeight: 700, margin: 0 }}>Enterprise Growth</h3>
                      <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: "0.25rem 0 0" }}>
                        $249.00 / month • Renews automatically on Dec 1, 2026
                      </p>
                    </div>
                    <button type="button" className={styles.btnSecondary} onClick={() => alert("Billing upgrade portal opened.")}>
                      Upgrade Plan
                    </button>
                  </div>

                  {/* Resource Usage Meters */}
                  <div className={styles.usageMeter}>
                    <div className={styles.usageHeader}>
                      <span className={styles.usageTitle}>Monthly AI Reasoning Tokens</span>
                      <span className={styles.usageValue}>342,000 / 500,000 (68%)</span>
                    </div>
                    <div className={styles.progressBarBg}>
                      <div className={styles.progressBarFill} style={{ width: "68%" }} />
                    </div>
                  </div>

                  <div className={styles.usageMeter}>
                    <div className={styles.usageHeader}>
                      <span className={styles.usageTitle}>Cloud Browser Container Hours</span>
                      <span className={styles.usageValue}>21 / 50 Hours (42%)</span>
                    </div>
                    <div className={styles.progressBarBg}>
                      <div className={styles.progressBarFill} style={{ width: "42%" }} />
                    </div>
                  </div>

                  <div className={styles.usageMeter}>
                    <div className={styles.usageHeader}>
                      <span className={styles.usageTitle}>Active Nano Agent Executions</span>
                      <span className={styles.usageValue}>1,420 / 5,000 Runs (28%)</span>
                    </div>
                    <div className={styles.progressBarBg}>
                      <div className={styles.progressBarFill} style={{ width: "28%" }} />
                    </div>
                  </div>
                </div>

                {/* Invoices */}
                <div className={styles.sectionCard}>
                  <div className={styles.sectionHeader}>
                    <div>
                      <h2 className={styles.sectionHeaderTitle}>Billing History &amp; Invoices</h2>
                      <p className={styles.sectionHeaderSubtitle}>Download official receipts and tax statements for your accounting department.</p>
                    </div>
                  </div>

                  <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Invoice Date</th>
                          <th>Description</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th>Receipt</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Oct 1, 2026</td>
                          <td style={{ fontWeight: 600 }}>Enterprise Growth — Monthly Subscription</td>
                          <td>$249.00 USD</td>
                          <td><span className={`${styles.badge} ${styles.badgeSuccess}`}>Paid</span></td>
                          <td>
                            <button type="button" className={styles.btnSecondary} style={{ padding: "0.25rem 0.5rem", fontSize: "0.72rem" }} onClick={() => alert("Downloading PDF Invoice...")}>
                              <DownloadIcon size={12} /> PDF
                            </button>
                          </td>
                        </tr>
                        <tr>
                          <td>Sep 1, 2026</td>
                          <td style={{ fontWeight: 600 }}>Enterprise Growth — Monthly Subscription</td>
                          <td>$249.00 USD</td>
                          <td><span className={`${styles.badge} ${styles.badgeSuccess}`}>Paid</span></td>
                          <td>
                            <button type="button" className={styles.btnSecondary} style={{ padding: "0.25rem 0.5rem", fontSize: "0.72rem" }} onClick={() => alert("Downloading PDF Invoice...")}>
                              <DownloadIcon size={12} /> PDF
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 16. AUDIT LOGS */}
            {activeSection === "audit-logs" && (
              <div>
                <header className={styles.pageHeader}>
                  <div className={styles.pageTitleGroup}>
                    <h1 className={styles.pageTitle}>
                      <DocumentsIcon size={20} />
                      <span>Enterprise Audit Logs</span>
                    </h1>
                    <p className={styles.pageDescription}>
                      Cryptographically verifiable security and activity trails for all agent invocations, member logins, and policy adjustments.
                    </p>
                  </div>
                  <div className={styles.pageHeaderAction}>
                    <button type="button" className={styles.btnSecondary} onClick={() => alert("Exporting audit log records as CSV...")}>
                      <DownloadIcon size={14} />
                      <span>Export CSV</span>
                    </button>
                  </div>
                </header>

                <div className={styles.sectionCard}>
                  <div className={styles.sectionHeader}>
                    <div>
                      <h2 className={styles.sectionHeaderTitle}>Security Event Stream</h2>
                      <p className={styles.sectionHeaderSubtitle}>Recent activity logged across your OperatSI enterprise tenant.</p>
                    </div>
                  </div>

                  <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Timestamp</th>
                          <th>Actor</th>
                          <th>Event Action</th>
                          <th>Target Resource</th>
                          <th>IP Address</th>
                          <th>Outcome</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ color: "var(--text-muted)", fontSize: "0.76rem" }}>Oct 17, 14:12:05</td>
                          <td style={{ fontWeight: 600 }}>Krishanth B</td>
                          <td>Update Security Policy</td>
                          <td>workspace/security</td>
                          <td>198.51.100.24</td>
                          <td><span className={`${styles.badge} ${styles.badgeSuccess}`}>Success</span></td>
                        </tr>
                        <tr>
                          <td style={{ color: "var(--text-muted)", fontSize: "0.76rem" }}>Oct 17, 13:45:22</td>
                          <td style={{ fontWeight: 600 }}>Nano Agent #408</td>
                          <td>Cloud Browser Session</td>
                          <td>container/chromium-89</td>
                          <td>10.0.4.12</td>
                          <td><span className={`${styles.badge} ${styles.badgeSuccess}`}>Success</span></td>
                        </tr>
                        <tr>
                          <td style={{ color: "var(--text-muted)", fontSize: "0.76rem" }}>Oct 17, 12:10:14</td>
                          <td style={{ fontWeight: 600 }}>Sarah Jenkins</td>
                          <td>Invite Member</td>
                          <td>members/new-invite</td>
                          <td>192.0.2.88</td>
                          <td><span className={`${styles.badge} ${styles.badgeSuccess}`}>Success</span></td>
                        </tr>
                        <tr>
                          <td style={{ color: "var(--text-muted)", fontSize: "0.76rem" }}>Oct 17, 11:04:30</td>
                          <td style={{ fontWeight: 600 }}>Krishanth B</td>
                          <td>API Key Roll</td>
                          <td>auth/credentials</td>
                          <td>198.51.100.24</td>
                          <td><span className={`${styles.badge} ${styles.badgeSuccess}`}>Success</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 17. DANGER ZONE */}
            {activeSection === "danger-zone" && (
              <div>
                <header className={styles.pageHeader}>
                  <div className={styles.pageTitleGroup}>
                    <h1 className={styles.pageTitle} style={{ color: "#ef4444" }}>
                      <AlertCircleIcon size={20} />
                      <span>Danger Zone</span>
                    </h1>
                    <p className={styles.pageDescription}>
                      Irreversible administrative operations including workspace transfer, data purge, and account termination.
                    </p>
                  </div>
                </header>

                {/* Transfer Workspace Ownership */}
                <div className={styles.dangerCard}>
                  <div className={styles.dangerHeader}>
                    <AlertCircleIcon size={18} />
                    <h3 className={styles.dangerTitle}>Transfer Workspace Ownership</h3>
                  </div>
                  <p className={styles.dangerDesc}>
                    Transfer all administrative ownership rights, billing obligations, and root permissions of this workspace to another verified member.
                  </p>
                  <button type="button" className={styles.btnSecondary} onClick={() => alert("Select a member to transfer ownership to.")}>
                    Transfer Ownership
                  </button>
                </div>

                {/* Delete Workspace */}
                <div className={styles.dangerCard}>
                  <div className={styles.dangerHeader}>
                    <TrashIcon size={18} />
                    <h3 className={styles.dangerTitle}>Delete Entire Workspace</h3>
                  </div>
                  <p className={styles.dangerDesc}>
                    Permanently destroy this workspace, including all Nano Agent workflows, CRM pipelines, integrations, and stored knowledge bases.
                  </p>
                  <button type="button" className={styles.btnDanger} onClick={() => alert("To delete the workspace, enter the workspace name to confirm.")}>
                    Delete Workspace
                  </button>
                </div>

                {/* Delete Personal Account */}
                <div className={styles.dangerCard}>
                  <div className={styles.dangerHeader}>
                    <TrashIcon size={18} />
                    <h3 className={styles.dangerTitle}>Delete My Personal Account</h3>
                  </div>
                  <p className={styles.dangerDesc}>
                    Permanently wipe your user profile documents, mobile numbers, activity logs, and authentication credentials from Firebase.
                  </p>
                  <button type="button" className={styles.btnDanger} onClick={handleOpenDeleteModal}>
                    <TrashIcon size={14} />
                    <span>Delete My Account Permanently</span>
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Delete Confirmation Modal (Danger Zone 3-Second Unlock) */}
      {isDeleteModalOpen && (
        <div className={styles.modalOverlay} onClick={handleCloseDeleteModal}>
          <div className={styles.modalDialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalIconDanger}>
                <AlertCircleIcon size={22} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 className={styles.modalTitle}>Delete OperatSI Account?</h3>
                <p className={styles.modalSubtitle}>This action is permanent and cannot be undone once confirmed.</p>
              </div>
              <button
                type="button"
                onClick={handleCloseDeleteModal}
                style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
                aria-label="Close dialog"
              >
                <CloseIcon size={18} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <p style={{ margin: "0 0 0.75rem 0" }}>
                <strong>Warning:</strong> You are about to initiate the permanent deletion of your account and all associated Firebase assets.
              </p>
              <ul style={{ margin: 0, paddingLeft: "1.25rem", color: "var(--text-muted)" }}>
                <li>All profile records ({activeUserName}, {activeUserEmail})</li>
                <li>Saved mobile numbers and security preferences</li>
                <li>All user activity logs and automated workflows in OperatSI</li>
              </ul>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={handleCloseDeleteModal}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.btnDanger}
                onClick={handleConfirmPermanentDelete}
                disabled={!isDeleteUnlocked || isDeleting}
              >
                {isDeleting ? (
                  <>
                    <SpinnerIcon size={14} />
                    <span>Deleting...</span>
                  </>
                ) : !isDeleteUnlocked ? (
                  `Wait ${unlockTimeLeft}s to Delete`
                ) : (
                  "Delete My Account Permanently"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
