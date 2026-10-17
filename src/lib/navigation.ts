export interface MenuItem {
  id: string;
  label: string;
  route: string;
  iconName: string;
  badge?: string;
  submenus?: string[];
  description?: string;
}

export interface MenuSection {
  title: string;
  items: MenuItem[];
}

export const NAVIGATION_SECTIONS: MenuSection[] = [
  {
    title: "WORKSPACE",
    items: [
      {
        id: "overview",
        label: "Overview",
        route: "/dashboard",
        iconName: "DashboardGridIcon",
        description: "Unified telemetry, active autonomous agents, and system health overview.",
      },
      {
        id: "ai",
        label: "Operatsi AI",
        route: "/ai",
        iconName: "OperatsiAiIcon",
        badge: "AI 2.0",
        submenus: ["New Chat", "Chat History", "Knowledge Base"],
        description: "Enterprise multi-agent chat interface with contextual memory and tool use.",
      },
      {
        id: "inbox",
        label: "Inbox",
        route: "/inbox",
        iconName: "InboxIcon",
        badge: "3",
        description: "Unified notifications, human-in-the-loop approvals, and agent alerts.",
      },
      {
        id: "my-tasks",
        label: "My Tasks",
        route: "/my-tasks",
        iconName: "TasksCheckIcon",
        description: "Assigned tasks, prioritized action items, and agent delegation backlog.",
      },
    ],
  },
  {
    title: "PLAN & EXECUTE",
    items: [
      {
        id: "planning",
        label: "Planning",
        route: "/planning",
        iconName: "PlanningIcon",
        submenus: ["My Plans", "Strategic Goals", "Roadmaps"],
        description: "Strategic planning, objective decomposition, and milestone alignment.",
      },
      {
        id: "projects",
        label: "Projects",
        route: "/projects",
        iconName: "ProjectsIcon",
        submenus: ["All Projects", "Boards", "Milestones"],
        description: "Cross-functional project tracking with agile boards and timeline milestones.",
      },
      {
        id: "agents",
        label: "Nano Agents",
        route: "/agents",
        iconName: "NanoAgentsIcon",
        badge: "Active",
        submenus: ["Agent Library", "My Agents", "Agent Runs"],
        description: "High-density autonomous nano-agent cluster orchestration and lifecycle control.",
      },
      {
        id: "workflows",
        label: "Workflows",
        route: "/workflows",
        iconName: "WorkflowBranchIcon",
        submenus: ["All Workflows", "Templates", "Scheduled Runs"],
        description: "Deterministic DAG pipelines, event-driven triggers, and failure fallback logic.",
      },
      {
        id: "browser",
        label: "Cloud Browser",
        route: "/browser",
        iconName: "CloudBrowserIcon",
        submenus: ["New Session, Active Sessions", "Session History"],
        description: "Isolated cloud container browser instances for automated web actions.",
      },
      {
        id: "executions",
        label: "Execution Center",
        route: "/executions",
        iconName: "ExecutionCenterIcon",
        submenus: ["Live Executions", "Approvals", "Run History", "Audit Logs"],
        description: "Real-time task executions, step-by-step verification, and sandbox inspectability.",
      },
    ],
  },
  {
    title: "BUSINESS",
    items: [
      {
        id: "crm",
        label: "CRM & Sales",
        route: "/crm",
        iconName: "CrmSalesIcon",
        submenus: ["Leads", "Contacts", "Deals", "Activities"],
        description: "Autonomous CRM prospecting, lead enrichment, and sales pipeline management.",
      },
      {
        id: "documents",
        label: "Documents",
        route: "/documents",
        iconName: "DocumentsIcon",
        submenus: ["All Files", "Shared Files", "Templates"],
        description: "Centralized knowledge files, shared templates, and secure document vaults.",
      },
      {
        id: "analytics",
        label: "Analytics",
        route: "/analytics",
        iconName: "AnalyticsIcon",
        submenus: ["Overview", "Performance", "Reports"],
        description: "Advanced operational metrics, token usage analytics, and agent productivity ROI.",
      },
      {
        id: "team",
        label: "Team & Departments",
        route: "/team",
        iconName: "TeamIcon",
        submenus: ["Members", "Departments", "Roles & Permissions"],
        description: "Organization hierarchy, department segregation, and RBAC governance.",
      },
    ],
  },
  {
    title: "MANAGEMENT",
    items: [
      {
        id: "integrations",
        label: "Integrations",
        route: "/integrations",
        iconName: "IntegrationsIcon",
        description: "Connect APIs, webhooks, GitHub, Slack, Notion, and cloud databases.",
      },
      {
        id: "billing",
        label: "Billing & Usage",
        route: "/billing",
        iconName: "BillingIcon",
        description: "Subscription tier, compute quota, invoice management, and usage trends.",
      },
      {
        id: "settings",
        label: "Settings",
        route: "/settings",
        iconName: "SettingsHexIcon",
        description: "Profile configuration, security keys, compliance controls, and workspace preferences.",
      },
    ],
  },
];

export const HELP_MENU_ITEM: MenuItem = {
  id: "help",
  label: "Help & Support",
  route: "/help",
  iconName: "HelpSupportIcon",
  description: "Documentation, API specifications, developer support, and enterprise SLA assistance.",
};

// Flattened lookup map
export const ALL_MENU_ITEMS: Record<string, MenuItem> = [
  ...NAVIGATION_SECTIONS.flatMap((s) => s.items),
  HELP_MENU_ITEM,
].reduce((acc, item) => {
  acc[item.route] = item;
  return acc;
}, {} as Record<string, MenuItem>);
