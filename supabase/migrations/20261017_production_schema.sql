-- ===============================================================
-- OPERATSI — PRODUCTION POSTGRESQL DATABASE SCHEMA
-- Comprehensive Multi-Tenant Entity Architecture with RLS
-- Target: Supabase PostgreSQL (Project: xvmlsgaxrrtkgxgkbzhb)
-- ===============================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. USER PROFILES TABLE (Mapped to Firebase Authentication UID)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id VARCHAR(128) PRIMARY KEY, -- Firebase Authentication UID
    email VARCHAR(255) NOT NULL,
    email_normalized VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    avatar_url TEXT,
    job_title VARCHAR(150),
    language VARCHAR(20) DEFAULT 'en-US',
    time_zone VARCHAR(100) DEFAULT 'UTC',
    phone_number VARCHAR(50),
    phone_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email_normalized);

-- 3. WORKSPACES TABLE
CREATE TABLE IF NOT EXISTS public.workspaces (
    id VARCHAR(100) PRIMARY KEY DEFAULT 'ws_primary',
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    owner_id VARCHAR(128) NOT NULL REFERENCES public.user_profiles(id) ON DELETE RESTRICT,
    industry VARCHAR(100) DEFAULT 'saas',
    data_region VARCHAR(50) DEFAULT 'us-east-1',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_workspaces_slug ON public.workspaces(slug);
CREATE INDEX IF NOT EXISTS idx_workspaces_owner ON public.workspaces(owner_id);

-- 4. WORKSPACE ROLES TABLE
CREATE TABLE IF NOT EXISTS public.workspace_roles (
    id TEXT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    is_system_role BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Seed System Roles
INSERT INTO public.workspace_roles (id, name, description, is_system_role)
VALUES 
    ('owner', 'Owner', 'Complete authority over workspace, financial billing, owner transfer, security policies, and administrators.', true),
    ('admin', 'Admin', 'Manage workspace configurations, team membership, role delegations, workflows, and operational audit telemetry.', true),
    ('manager', 'Manager', 'Coordinate team departments, supervise project task execution, review approval queues, and invite contributors.', true),
    ('member', 'Member', 'Execute assigned Nano Agents, manage project workflows, access CRM pipelines, and collaborate across teams.', true),
    ('viewer', 'Viewer', 'Strictly read-only visibility into authorized workspace dashboards, metrics, knowledge bases, and tasks.', true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description;

-- 5. ROLE PERMISSIONS TABLE
CREATE TABLE IF NOT EXISTS public.workspace_role_permissions (
    role_id TEXT NOT NULL REFERENCES public.workspace_roles(id) ON DELETE CASCADE,
    permission_key VARCHAR(100) NOT NULL,
    PRIMARY KEY (role_id, permission_key)
);

-- Seed Permissions Matrix
INSERT INTO public.workspace_role_permissions (role_id, permission_key) VALUES
    ('owner', 'members.read'),
    ('owner', 'members.invite'),
    ('owner', 'members.remove'),
    ('owner', 'members.role.update'),
    ('owner', 'invitations.revoke'),
    ('owner', 'invitations.resend'),
    ('owner', 'invitations.change_role'),
    ('owner', 'workspace.settings.update'),
    ('owner', 'billing.manage'),
    ('owner', 'agents.execute'),
    ('owner', 'agents.manage'),
    ('owner', 'approvals.manage'),
    ('owner', 'audit.read'),

    ('admin', 'members.read'),
    ('admin', 'members.invite'),
    ('admin', 'members.remove'),
    ('admin', 'members.role.update'),
    ('admin', 'invitations.revoke'),
    ('admin', 'invitations.resend'),
    ('admin', 'invitations.change_role'),
    ('admin', 'workspace.settings.update'),
    ('admin', 'agents.execute'),
    ('admin', 'agents.manage'),
    ('admin', 'approvals.manage'),
    ('admin', 'audit.read'),

    ('manager', 'members.read'),
    ('manager', 'members.invite'),
    ('manager', 'agents.execute'),
    ('manager', 'agents.manage'),
    ('manager', 'approvals.manage'),

    ('member', 'members.read'),
    ('member', 'agents.execute'),

    ('viewer', 'members.read')
ON CONFLICT DO NOTHING;

-- 6. WORKSPACE MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.workspace_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id VARCHAR(100) NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id VARCHAR(128) NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    role_id TEXT NOT NULL REFERENCES public.workspace_roles(id),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'suspended')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    last_active_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_workspace_member UNIQUE (workspace_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_id ON public.workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id ON public.workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_role ON public.workspace_members(role_id);

-- 7. WORKSPACE INVITATIONS TABLE
CREATE TABLE IF NOT EXISTS public.workspace_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id VARCHAR(100) NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    invited_email VARCHAR(255) NOT NULL,
    invited_email_normalized VARCHAR(255) NOT NULL,
    role_id TEXT NOT NULL REFERENCES public.workspace_roles(id),
    invited_by VARCHAR(128) NOT NULL REFERENCES public.user_profiles(id) ON DELETE RESTRICT,
    inviter_name VARCHAR(255) NOT NULL,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked', 'expired')),
    message TEXT,
    delivery_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (delivery_status IN ('delivered', 'failed', 'pending')),
    delivery_error TEXT,
    delivery_message_id VARCHAR(255),
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_by VARCHAR(128) REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    accepted_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_invitations_token_hash ON public.workspace_invitations(token_hash);
CREATE INDEX IF NOT EXISTS idx_invitations_workspace_email ON public.workspace_invitations(workspace_id, invited_email_normalized);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON public.workspace_invitations(status);

-- 8. PROJECTS TABLE
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id VARCHAR(100) NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'completed')),
    created_by VARCHAR(128) NOT NULL REFERENCES public.user_profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_projects_workspace ON public.projects(workspace_id);

-- 9. TASKS TABLE
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id VARCHAR(100) NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done')),
    priority VARCHAR(50) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    assignee_id VARCHAR(128) REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    created_by VARCHAR(128) NOT NULL REFERENCES public.user_profiles(id),
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_tasks_workspace ON public.tasks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON public.tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);

-- 10. SECURITY AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id VARCHAR(100) NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    actor_user_id VARCHAR(128) NOT NULL,
    actor_name VARCHAR(255) NOT NULL,
    actor_email VARCHAR(255) NOT NULL,
    target_user_id VARCHAR(128),
    target_email VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    previous_value TEXT,
    new_value TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_workspace ON public.security_audit_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.security_audit_logs(created_at DESC);

-- 11. NOTIFICATION EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.notification_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_uid VARCHAR(128) NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    workspace_id VARCHAR(100) NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    priority VARCHAR(50) NOT NULL DEFAULT 'normal',
    resource_type VARCHAR(100),
    resource_id VARCHAR(100),
    action_url TEXT,
    read_at TIMESTAMPTZ,
    archived_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notification_events(recipient_uid, read_at);

-- 12. AUTO-UPDATED TIMESTAMPS TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply Triggers
DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN VALUES ('user_profiles'), ('workspaces'), ('workspace_members'), ('workspace_invitations'), ('projects'), ('tasks') LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trigger_updated_at ON public.%I', tbl);
        EXECUTE format('CREATE TRIGGER trigger_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at()', tbl);
    END LOOP;
END $$;

-- ===============================================================
-- 13. ROW LEVEL SECURITY (RLS) & TENANT ISOLATION POLICIES
-- ===============================================================

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_events ENABLE ROW LEVEL SECURITY;

-- Helper function: Extracts Firebase UID from JWT claims
CREATE OR REPLACE FUNCTION public.firebase_auth_uid()
RETURNS TEXT AS $$
    SELECT COALESCE(
        auth.jwt() ->> 'sub',
        auth.jwt() ->> 'user_id',
        auth.uid()::text
    );
$$ LANGUAGE sql STABLE;

-- User Profiles: Users can view profiles and update their own profile
DROP POLICY IF EXISTS "Users can read all workspace member profiles" ON public.user_profiles;
CREATE POLICY "Users can read all workspace member profiles"
    ON public.user_profiles FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
CREATE POLICY "Users can update their own profile"
    ON public.user_profiles FOR UPDATE
    TO authenticated
    USING (id = public.firebase_auth_uid());

-- Roles and Permissions: Read-only access to all authenticated members
DROP POLICY IF EXISTS "Roles are readable by authenticated members" ON public.workspace_roles;
CREATE POLICY "Roles are readable by authenticated members"
    ON public.workspace_roles FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Permissions are readable by authenticated members" ON public.workspace_role_permissions;
CREATE POLICY "Permissions are readable by authenticated members"
    ON public.workspace_role_permissions FOR SELECT
    TO authenticated
    USING (true);

-- Workspaces: Members can view the workspaces they belong to
DROP POLICY IF EXISTS "Members can view their workspaces" ON public.workspaces;
CREATE POLICY "Members can view their workspaces"
    ON public.workspaces FOR SELECT
    TO authenticated
    USING (
        id IN (
            SELECT m.workspace_id FROM public.workspace_members m WHERE m.user_id = public.firebase_auth_uid()
        )
    );

-- Workspace Members: Members can view fellow members in their workspaces
DROP POLICY IF EXISTS "Members can view workspace member roster" ON public.workspace_members;
CREATE POLICY "Members can view workspace member roster"
    ON public.workspace_members FOR SELECT
    TO authenticated
    USING (
        workspace_id IN (
            SELECT m.workspace_id FROM public.workspace_members m WHERE m.user_id = public.firebase_auth_uid()
        )
    );

-- Workspace Invitations: Viewable by workspace members
DROP POLICY IF EXISTS "Members can view workspace invitations" ON public.workspace_invitations;
CREATE POLICY "Members can view workspace invitations"
    ON public.workspace_invitations FOR SELECT
    TO authenticated
    USING (
        workspace_id IN (
            SELECT m.workspace_id FROM public.workspace_members m WHERE m.user_id = public.firebase_auth_uid()
        )
    );

-- Projects: Isolated per workspace
DROP POLICY IF EXISTS "Members can view projects in their workspace" ON public.projects;
CREATE POLICY "Members can view projects in their workspace"
    ON public.projects FOR SELECT
    TO authenticated
    USING (
        workspace_id IN (
            SELECT m.workspace_id FROM public.workspace_members m WHERE m.user_id = public.firebase_auth_uid()
        )
    );

-- Tasks: Isolated per workspace
DROP POLICY IF EXISTS "Members can view tasks in their workspace" ON public.tasks;
CREATE POLICY "Members can view tasks in their workspace"
    ON public.tasks FOR SELECT
    TO authenticated
    USING (
        workspace_id IN (
            SELECT m.workspace_id FROM public.workspace_members m WHERE m.user_id = public.firebase_auth_uid()
        )
    );

-- Notifications: Strictly scoped to the authenticated recipient
DROP POLICY IF EXISTS "Users can view and manage their own notifications" ON public.notification_events;
CREATE POLICY "Users can view and manage their own notifications"
    ON public.notification_events FOR ALL
    TO authenticated
    USING (recipient_uid = public.firebase_auth_uid());

-- Security Audit Logs: Only workspace Owners and Admins can view
DROP POLICY IF EXISTS "Admins can view workspace audit logs" ON public.security_audit_logs;
CREATE POLICY "Admins can view workspace audit logs"
    ON public.security_audit_logs FOR SELECT
    TO authenticated
    USING (
        workspace_id IN (
            SELECT m.workspace_id FROM public.workspace_members m 
            WHERE m.user_id = public.firebase_auth_uid() 
            AND m.role_id IN ('owner', 'admin')
        )
    );

-- 15. AUTOMATIC UPDATED_AT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at Triggers
DROP TRIGGER IF EXISTS trg_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER trg_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_workspaces_updated_at ON public.workspaces;
CREATE TRIGGER trg_workspaces_updated_at
    BEFORE UPDATE ON public.workspaces
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_workspace_members_updated_at ON public.workspace_members;
CREATE TRIGGER trg_workspace_members_updated_at
    BEFORE UPDATE ON public.workspace_members
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_workspace_invitations_updated_at ON public.workspace_invitations;
CREATE TRIGGER trg_workspace_invitations_updated_at
    BEFORE UPDATE ON public.workspace_invitations
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_projects_updated_at ON public.projects;
CREATE TRIGGER trg_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_tasks_updated_at ON public.tasks;
CREATE TRIGGER trg_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

