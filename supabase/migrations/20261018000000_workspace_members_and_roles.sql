-- ===============================================================
-- OPERATSI — PRODUCTION WORKSPACE MEMBERSHIP, RBAC & INVITATIONS
-- Database Migration: PostgreSQL / Supabase
-- Version: 20261017_workspace_members_and_roles.sql
-- ===============================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. WORKSPACE ROLES TABLE
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
    ('owner', 'Owner', 'Full workspace administration, billing, security, and member management.', true),
    ('admin', 'Admin', 'Manage workspace settings, invite/remove members, and supervise operations.', true),
    ('manager', 'Manager', 'Manage assigned teams, projects, task delegation, and report generation.', true),
    ('member', 'Member', 'Access assigned projects, tasks, Nano Agents, and workspace resources.', true),
    ('viewer', 'Viewer', 'Read-only access to authorized workspace data.', true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description;

-- 3. WORKSPACE ROLE PERMISSIONS TABLE
CREATE TABLE IF NOT EXISTS public.workspace_role_permissions (
    role_id TEXT NOT NULL REFERENCES public.workspace_roles(id) ON DELETE CASCADE,
    permission_key VARCHAR(100) NOT NULL,
    PRIMARY KEY (role_id, permission_key)
);

-- Seed Role Permissions
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

-- 4. WORKSPACE MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.workspace_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id VARCHAR(100) NOT NULL DEFAULT 'ws_primary',
    user_id VARCHAR(128) NOT NULL,
    email VARCHAR(255),
    email_normalized VARCHAR(255),
    name VARCHAR(255),
    display_name VARCHAR(255),
    avatar_url TEXT,
    role_id TEXT NOT NULL REFERENCES public.workspace_roles(id),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'suspended')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    last_active_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_workspace_member UNIQUE (workspace_id, user_id)
);

ALTER TABLE public.workspace_members ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE public.workspace_members ADD COLUMN IF NOT EXISTS email_normalized VARCHAR(255);
ALTER TABLE public.workspace_members ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE public.workspace_members ADD COLUMN IF NOT EXISTS display_name VARCHAR(255);
ALTER TABLE public.workspace_members ADD COLUMN IF NOT EXISTS avatar_url TEXT;

CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_id ON public.workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id ON public.workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_email_norm ON public.workspace_members(email_normalized);
CREATE INDEX IF NOT EXISTS idx_workspace_members_role ON public.workspace_members(role_id);

-- 5. WORKSPACE INVITATIONS TABLE
CREATE TABLE IF NOT EXISTS public.workspace_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id VARCHAR(100) NOT NULL DEFAULT 'ws_primary',
    invited_email VARCHAR(255) NOT NULL,
    invited_email_normalized VARCHAR(255) NOT NULL,
    role_id TEXT NOT NULL REFERENCES public.workspace_roles(id),
    invited_by VARCHAR(128) NOT NULL,
    inviter_name VARCHAR(255) NOT NULL,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked', 'expired')),
    message TEXT,
    delivery_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (delivery_status IN ('delivered', 'failed', 'pending')),
    delivery_error TEXT,
    delivery_message_id VARCHAR(255),
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_by VARCHAR(128),
    accepted_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_workspace_invitations_token_hash ON public.workspace_invitations(token_hash);
CREATE INDEX IF NOT EXISTS idx_workspace_invitations_workspace_email ON public.workspace_invitations(workspace_id, invited_email_normalized);
CREATE INDEX IF NOT EXISTS idx_workspace_invitations_status ON public.workspace_invitations(status);

-- 6. WORKSPACE MEMBERSHIP AUDIT LOG TABLE
CREATE TABLE IF NOT EXISTS public.workspace_membership_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id VARCHAR(100) NOT NULL DEFAULT 'ws_primary',
    actor_user_id VARCHAR(128) NOT NULL,
    actor_name VARCHAR(255) NOT NULL,
    actor_email VARCHAR(255) NOT NULL,
    target_user_id VARCHAR(128),
    target_email VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    previous_value TEXT,
    new_value TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_workspace_audit_workspace_id ON public.workspace_membership_audit(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_audit_created_at ON public.workspace_membership_audit(created_at DESC);

-- 7. AUTO-UPDATE TIMESTAMP TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_workspace_members_updated_at ON public.workspace_members;
CREATE TRIGGER trigger_workspace_members_updated_at
    BEFORE UPDATE ON public.workspace_members
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_workspace_invitations_updated_at ON public.workspace_invitations;
CREATE TRIGGER trigger_workspace_invitations_updated_at
    BEFORE UPDATE ON public.workspace_invitations
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 8. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.workspace_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_membership_audit ENABLE ROW LEVEL SECURITY;

-- Allow authenticated members to read roles and permissions
DROP POLICY IF EXISTS "Allow authenticated read on workspace_roles" ON public.workspace_roles;
CREATE POLICY "Allow authenticated read on workspace_roles"
    ON public.workspace_roles FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow authenticated read on workspace_role_permissions" ON public.workspace_role_permissions;
CREATE POLICY "Allow authenticated read on workspace_role_permissions"
    ON public.workspace_role_permissions FOR SELECT
    TO authenticated
    USING (true);

-- Workspace members can view members in their workspace
DROP POLICY IF EXISTS "Workspace members view members" ON public.workspace_members;
CREATE POLICY "Workspace members view members"
    ON public.workspace_members FOR SELECT
    TO authenticated
    USING (
        workspace_id IN (
            SELECT m.workspace_id FROM public.workspace_members m WHERE m.user_id = auth.uid()::text
        )
    );

-- Workspace members can view invitations in their workspace
DROP POLICY IF EXISTS "Workspace members view invitations" ON public.workspace_invitations;
CREATE POLICY "Workspace members view invitations"
    ON public.workspace_invitations FOR SELECT
    TO authenticated
    USING (
        workspace_id IN (
            SELECT m.workspace_id FROM public.workspace_members m WHERE m.user_id = auth.uid()::text
        )
    );
