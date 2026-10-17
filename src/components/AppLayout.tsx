"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";
import {
  DashboardGridIcon,
  OperatsiAiIcon,
  InboxIcon,
  TasksCheckIcon,
  PlanningIcon,
  ProjectsIcon,
  NanoAgentsIcon,
  WorkflowBranchIcon,
  CloudBrowserIcon,
  ExecutionCenterIcon,
  CrmSalesIcon,
  DocumentsIcon,
  AnalyticsIcon,
  TeamIcon,
  IntegrationsIcon,
  BillingIcon,
  SettingsHexIcon,
  HelpSupportIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MenuToggleIcon,
  LogoutIcon,
  SearchIcon,
  BellIcon,
  PlusIcon,
  MoreHorizontalIcon,
  UserIcon,
} from "./Icons";
import {
  NAVIGATION_SECTIONS,
  HELP_MENU_ITEM,
  ALL_MENU_ITEMS,
  MenuItem,
} from "../lib/navigation";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import styles from "./AppLayout.module.css";

interface AppLayoutProps {
  children: React.ReactNode;
  activeRoute?: string;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children, activeRoute }) => {
  const router = useRouter();
  const currentPathname = usePathname();
  const currentRoute = activeRoute || currentPathname || "/dashboard";

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    ai: true,
    agents: true,
    workflows: true,
  });
  const [searchQuery, setSearchQuery] = useState("");

  // Auth User details
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
          // Keep default user details
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
  const userInitial = (activeUserName?.[0] || activeUserEmail?.[0] || "O").toUpperCase();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch {
      // Continue
    }
    router.push("/");
  };

  const toggleSubmenu = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedMenus((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const renderIcon = (name: string, size = 18) => {
    switch (name) {
      case "DashboardGridIcon":
        return <DashboardGridIcon size={size} />;
      case "OperatsiAiIcon":
        return <OperatsiAiIcon size={size} />;
      case "InboxIcon":
        return <InboxIcon size={size} />;
      case "TasksCheckIcon":
        return <TasksCheckIcon size={size} />;
      case "PlanningIcon":
        return <PlanningIcon size={size} />;
      case "ProjectsIcon":
        return <ProjectsIcon size={size} />;
      case "NanoAgentsIcon":
        return <NanoAgentsIcon size={size} />;
      case "WorkflowBranchIcon":
        return <WorkflowBranchIcon size={size} />;
      case "CloudBrowserIcon":
        return <CloudBrowserIcon size={size} />;
      case "ExecutionCenterIcon":
        return <ExecutionCenterIcon size={size} />;
      case "CrmSalesIcon":
        return <CrmSalesIcon size={size} />;
      case "DocumentsIcon":
        return <DocumentsIcon size={size} />;
      case "AnalyticsIcon":
        return <AnalyticsIcon size={size} />;
      case "TeamIcon":
        return <TeamIcon size={size} />;
      case "IntegrationsIcon":
        return <IntegrationsIcon size={size} />;
      case "BillingIcon":
        return <BillingIcon size={size} />;
      case "SettingsHexIcon":
        return <SettingsHexIcon size={size} />;
      case "HelpSupportIcon":
        return <HelpSupportIcon size={size} />;
      default:
        return <DashboardGridIcon size={size} />;
    }
  };

  const currentItem = ALL_MENU_ITEMS[currentRoute] || ALL_MENU_ITEMS["/dashboard"];

  return (
    <div className={styles.appContainer}>
      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className={styles.mobileOverlay} onClick={() => setIsMobileOpen(false)} />
      )}

      {/* =========================================================
          LEFT SIDEBAR NAVIGATION
          ========================================================= */}
      <aside
        className={`${styles.sidebar} ${
          isSidebarOpen ? styles.sidebarOpen : styles.sidebarClosed
        } ${isMobileOpen ? styles.sidebarMobileOpen : ""}`}
        aria-label="Main Navigation"
      >
        {/* Brand Header with Logo from public/OperatSI.png */}
        <div className={styles.sidebarHeader}>
          <Link href="/dashboard" className={styles.brandLink}>
            <div className={styles.brandLogoWrapper}>
              <Image
                src="/OperatSI.png"
                alt="OperatSI"
                width={24}
                height={24}
                priority
                className={styles.brandLogoImg}
                style={{ width: "auto", height: "auto" }}
              />
            </div>
            {isSidebarOpen && (
              <div className={styles.brandText}>
                <span className={styles.brandTitle}>OperatSI</span>
                <span className={styles.brandBadge}>AI Enterprise</span>
              </div>
            )}
          </Link>

          <button
            type="button"
            className={styles.toggleSidebarBtn}
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {isSidebarOpen ? <ChevronLeftIcon size={14} /> : <ChevronRightIcon size={14} />}
          </button>
        </div>

        {/* Scrollable Navigation List organized into 4 sections */}
        <nav className={styles.sidebarNav}>
          {NAVIGATION_SECTIONS.map((section, sIdx) => (
            <div key={section.title} className={styles.sidebarSection}>
              {isSidebarOpen ? (
                <div className={styles.sidebarSectionTitle}>{section.title}</div>
              ) : sIdx > 0 ? (
                <div className={styles.sectionDividerClosed} />
              ) : null}

              {section.items.map((item: MenuItem) => {
                const isActive =
                  currentRoute === item.route ||
                  (item.route !== "/dashboard" && currentRoute.startsWith(item.route));
                const hasSubmenus = Boolean(item.submenus && item.submenus.length > 0);
                const isExpanded = Boolean(expandedMenus[item.id]);

                return (
                  <div key={item.id} className={styles.navItemWrapper}>
                    <Link
                      href={item.route}
                      className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
                      onClick={() => setIsMobileOpen(false)}
                      title={!isSidebarOpen ? item.label : undefined}
                      aria-label={item.label}
                    >
                      <div className={styles.navItemIcon}>{renderIcon(item.iconName, 18)}</div>
                      {isSidebarOpen && (
                        <>
                          <span className={styles.navItemLabel}>{item.label}</span>
                          {item.badge && <span className={styles.navItemBadge}>{item.badge}</span>}
                          {hasSubmenus && (
                            <span
                              className={`${styles.submenuChevron} ${
                                isExpanded ? styles.submenuChevronOpen : ""
                              }`}
                              onClick={(e) => toggleSubmenu(item.id, e)}
                            >
                              <ChevronRightIcon size={12} />
                            </span>
                          )}
                        </>
                      )}
                    </Link>

                    {/* Inline Collapsible Submenu */}
                    {isSidebarOpen && hasSubmenus && isExpanded && (
                      <div className={styles.submenuList}>
                        {item.submenus!.map((sub: string) => (
                          <Link
                            key={sub}
                            href={`${item.route}?tab=${encodeURIComponent(
                              sub.toLowerCase().replace(/\s+/g, "-")
                            )}`}
                            className={styles.submenuItem}
                            onClick={() => setIsMobileOpen(false)}
                          >
                            {sub}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>

        {/* =========================================================
            SIDEBAR BOTTOM: Help & Support + My Account
            ========================================================= */}
        <div className={styles.sidebarBottom}>
          <Link
            href={HELP_MENU_ITEM.route}
            className={`${styles.navItem} ${
              currentRoute === HELP_MENU_ITEM.route ? styles.navItemActive : ""
            }`}
            onClick={() => setIsMobileOpen(false)}
            title={!isSidebarOpen ? HELP_MENU_ITEM.label : undefined}
          >
            <div className={styles.navItemIcon}>{renderIcon(HELP_MENU_ITEM.iconName, 18)}</div>
            {isSidebarOpen && <span className={styles.navItemLabel}>{HELP_MENU_ITEM.label}</span>}
          </Link>

          {/* User Account Card */}
          <Link
            href="/settings"
            className={styles.sidebarUserCard}
            title={`${activeUserName} (${activeUserEmail}) — Manage profile & settings`}
          >
            <div className={styles.sidebarUserAvatar}>
              <UserIcon size={16} />
            </div>
            {isSidebarOpen && (
              <>
                <div className={styles.sidebarUserInfo}>
                  <span className={styles.sidebarUserName}>{activeUserName}</span>
                  <span className={styles.sidebarUserRole}>Profile &amp; preferences</span>
                </div>
                <button
                  type="button"
                  className={styles.sidebarUserMore}
                  title="Account Settings"
                  aria-label="Account Settings"
                  onClick={(e) => {
                    e.preventDefault();
                    router.push("/settings");
                  }}
                >
                  <MoreHorizontalIcon size={16} />
                </button>
              </>
            )}
          </Link>
        </div>
      </aside>

      {/* =========================================================
          MAIN APPLICATION WRAPPER (HEADER + CONTENT)
          ========================================================= */}
      <div
        className={`${styles.mainWrapper} ${
          isSidebarOpen ? styles.mainWrapperWithSidebarOpen : styles.mainWrapperWithSidebarClosed
        }`}
      >
        {/* COMPACT TOP HEADER (52px) */}
        <header className={styles.topHeader}>
          <div className={styles.topHeaderLeft}>
            <button
              type="button"
              className={styles.mobileMenuBtn}
              onClick={() => setIsMobileOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
            >
              <MenuToggleIcon size={18} />
            </button>

            <div className={styles.breadcrumbGroup}>
              <Link href="/dashboard" className={styles.breadcrumbRoot}>
                OperatSI
              </Link>
              <span className={styles.breadcrumbSeparator}>/</span>
              <span className={styles.breadcrumbCurrent}>{currentItem.label}</span>
            </div>

            <div className={styles.statusPill}>
              <span className={styles.pulseDotWrapper}>
                <span className={styles.pulsePing} />
                <span className={styles.pulseDot} />
              </span>
              <span>3 Online</span>
            </div>
          </div>

          {/* Expandable Search Input */}
          <div className={styles.searchBarWrapper}>
            <SearchIcon size={14} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search platform, agents, logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            <kbd className={styles.searchKbd}>⌘K</kbd>
          </div>

          {/* Top Right Controls */}
          <div className={styles.topHeaderRight}>
            <button
              type="button"
              className={styles.actionButton}
              onClick={() => router.push("/ai")}
            >
              <PlusIcon size={13} />
              <span>New Agent</span>
            </button>

            <div className={styles.headerDivider} />

            <button
              type="button"
              className={styles.iconBtn}
              title="Notifications"
              aria-label="Notifications"
              onClick={() => router.push("/inbox")}
            >
              <BellIcon size={15} />
              <span className={styles.unreadDot} />
            </button>

            {/* Global Theme Toggle */}
            <ThemeToggle />

            <div className={styles.headerDivider} />

            {/* User Chip */}
            <Link
              href="/settings"
              className={styles.topUserPill}
              title={`${activeUserName} (${activeUserEmail})`}
            >
              <div className={styles.topUserAvatar}>
                <UserIcon size={14} />
              </div>
              <span className={styles.topUserName}>{activeUserName}</span>
            </Link>

            {/* Sign Out */}
            <button
              type="button"
              className={`${styles.iconBtn} ${styles.logoutBtn}`}
              onClick={handleSignOut}
              title="Sign Out of OperatSI"
              aria-label="Sign out"
            >
              <LogoutIcon size={16} />
            </button>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className={styles.mainContent}>{children}</main>
      </div>
    </div>
  );
};
