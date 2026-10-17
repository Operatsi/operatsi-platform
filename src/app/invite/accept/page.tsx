"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import styles from "./accept.module.css";
import { auth, db } from "@/lib/firebase";
import {
  onAuthStateChanged,
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from "firebase/auth";
import {
  SpinnerIcon,
  CheckIcon,
  AlertCircleIcon,
  GoogleIcon,
  BuildingIcon,
  TeamIcon,
  LogOutIcon,
} from "@/components/Icons";

interface InvitationDetails {
  valid: boolean;
  workspaceId?: string;
  workspaceName?: string;
  invitedEmail?: string;
  role?: string;
  inviterName?: string;
  message?: string | null;
  error?: string;
}

function AcceptInviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  // Invitation state
  const [isValidating, setIsValidating] = useState(true);
  const [invite, setInvite] = useState<InvitationDetails | null>(null);

  // Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Acceptance state
  const [isAccepting, setIsAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [acceptSuccess, setAcceptSuccess] = useState(false);

  // 1. Validate Token on mount
  useEffect(() => {
    if (!token) {
      setIsValidating(false);
      setInvite({ valid: false, error: "Missing invitation token in URL." });
      return;
    }

    const validateToken = async () => {
      try {
        const res = await fetch(`/api/workspace/invitations/validate?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        setInvite(data);
        if (data.invitedEmail) {
          setEmailInput(data.invitedEmail);
        }
      } catch (err: any) {
        setInvite({ valid: false, error: "Failed to validate invitation link." });
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token]);

  // 2. Track Firebase Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsub();
  }, []);

  // 3. Handle Email/Password Sign-In or Sign-Up
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !passwordInput) {
      setAuthError("Please provide both email and password.");
      return;
    }

    setIsAuthenticating(true);
    setAuthError(null);

    try {
      if (authMode === "signin") {
        await signInWithEmailAndPassword(auth, emailInput.trim(), passwordInput);
      } else {
        await createUserWithEmailAndPassword(auth, emailInput.trim(), passwordInput);
      }
    } catch (err: any) {
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setAuthError("Invalid email or password.");
      } else if (err.code === "auth/email-already-in-use") {
        setAuthError("An account with this email already exists. Please switch to Sign In.");
      } else if (err.code === "auth/weak-password") {
        setAuthError("Password must be at least 6 characters.");
      } else {
        setAuthError(err.message || "Authentication failed.");
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  // 4. Handle Google Sign-In
  const handleGoogleSignIn = async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setAuthError(err.message || "Google sign in was cancelled or failed.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  // 5. Handle Switch Account
  const handleSwitchAccount = async () => {
    await signOut(auth);
    setAcceptError(null);
  };

  // 6. Handle Accept Invitation
  const handleAcceptInvite = async () => {
    if (!currentUser || !token) return;
    setIsAccepting(true);
    setAcceptError(null);

    try {
      const idToken = await currentUser.getIdToken();
      const res = await fetch("/api/workspace/invitations/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to accept invitation");
      }

      setAcceptSuccess(true);
      setTimeout(() => {
        router.push("/settings");
      }, 2500);
    } catch (err: any) {
      setAcceptError(err.message || "An unexpected error occurred while accepting.");
    } finally {
      setIsAccepting(false);
    }
  };

  // Render: Loading Token
  if (isValidating) {
    return (
      <div className={styles.container}>
        <div className={styles.card} style={{ textAlign: "center", padding: "3rem 2rem" }}>
          <div style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>
            <SpinnerIcon size={32} />
          </div>
          <h2 style={{ fontSize: "1.1rem", marginTop: "1rem", color: "var(--text-primary)" }}>
            Validating Workspace Invitation...
          </h2>
          <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
            Checking security token and organization policies.
          </p>
        </div>
      </div>
    );
  }

  // Render: Invalid or Expired Token
  if (!invite || !invite.valid) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <div className={styles.logoRow}>
              <span className={styles.logoText}>Operat<span className={styles.logoAccent}>SI</span></span>
            </div>
            <h1 className={styles.title}>Invitation Unavailable</h1>
            <p className={styles.subtitle}>The requested workspace invitation could not be resolved.</p>
          </div>
          <div className={styles.body}>
            <div className={`${styles.alertBox} ${styles.alertError}`}>
              <AlertCircleIcon size={18} />
              <span>{invite?.error || "This invitation link is invalid, expired, or has already been accepted."}</span>
            </div>
            <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: "1.5rem" }}>
              Please reach out to the workspace administrator who sent you this invitation to issue a fresh link.
            </p>
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={() => router.push("/")}
            >
              Return to Home
            </button>
          </div>
          <div className={styles.footer}>
            Operatsi Enterprise &bull; An OVIC Labs Platform
          </div>
        </div>
      </div>
    );
  }

  // Render: Accepted Success State
  if (acceptSuccess) {
    return (
      <div className={styles.container}>
        <div className={styles.card} style={{ textAlign: "center", padding: "3rem 2rem" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "rgba(22, 163, 74, 0.15)",
              color: "#22c55e",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1.25rem",
            }}
          >
            <CheckIcon size={28} />
          </div>
          <h2 className={styles.title}>Welcome to {invite.workspaceName}!</h2>
          <p className={styles.subtitle} style={{ marginBottom: "1.5rem" }}>
            You have successfully joined as <strong>{invite.role}</strong>. Redirecting you to workspace settings...
          </p>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={() => router.push("/settings")}
          >
            Open Workspace Settings &rarr;
          </button>
        </div>
      </div>
    );
  }

  // Check email match if signed in
  const isEmailMatch = currentUser?.email && invite.invitedEmail
    ? currentUser.email.toLowerCase().trim() === invite.invitedEmail.toLowerCase().trim()
    : false;

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logoRow}>
            <span className={styles.logoText}>Operat<span className={styles.logoAccent}>SI</span></span>
          </div>
          <h1 className={styles.title}>Workspace Invitation</h1>
          <p className={styles.subtitle}>
            You&apos;ve been invited to join <strong>{invite.workspaceName}</strong>.
          </p>
        </div>

        <div className={styles.body}>
          {/* Summary Box */}
          <div className={styles.inviteSummaryCard}>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Workspace</span>
              <span className={styles.summaryVal}>
                <BuildingIcon size={13} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} />
                {invite.workspaceName}
              </span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Invited By</span>
              <span className={styles.summaryVal}>{invite.inviterName}</span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Assigned Role</span>
              <span className={`${styles.badge} ${invite.role === "admin" ? styles.badgeInfo : styles.badgeNeutral}`}>
                {invite.role}
              </span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Target Email</span>
              <span className={styles.summaryVal}>{invite.invitedEmail}</span>
            </div>
          </div>

          {invite.message && (
            <div
              style={{
                fontStyle: "italic",
                fontSize: "0.8rem",
                color: "var(--text-secondary)",
                background: "rgba(255, 255, 255, 0.02)",
                padding: "0.6rem 0.85rem",
                borderRadius: "6px",
                borderLeft: "3px solid var(--brand-accent)",
                marginBottom: "1.25rem",
              }}
            >
              &ldquo;{invite.message}&rdquo;
            </div>
          )}

          {/* User NOT Signed In */}
          {!currentUser && (
            <div>
              <div className={styles.authTabs}>
                <button
                  type="button"
                  className={`${styles.authTab} ${authMode === "signin" ? styles.authTabActive : ""}`}
                  onClick={() => setAuthMode("signin")}
                >
                  Sign In to Accept
                </button>
                <button
                  type="button"
                  className={`${styles.authTab} ${authMode === "signup" ? styles.authTabActive : ""}`}
                  onClick={() => setAuthMode("signup")}
                >
                  Create Account to Accept
                </button>
              </div>

              {authError && (
                <div className={`${styles.alertBox} ${styles.alertError}`}>
                  <AlertCircleIcon size={16} />
                  <span>{authError}</span>
                </div>
              )}

              <form onSubmit={handleAuthSubmit}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Work Email</label>
                  <input
                    type="email"
                    className={styles.input}
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="name@company.com"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Password</label>
                  <input
                    type="password"
                    className={styles.input}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Enter account password"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className={styles.btnPrimary}
                  disabled={isAuthenticating}
                >
                  {isAuthenticating ? (
                    <>
                      <SpinnerIcon size={16} />
                      <span>Authenticating...</span>
                    </>
                  ) : authMode === "signin" ? (
                    "Sign In & Continue"
                  ) : (
                    "Create Account & Continue"
                  )}
                </button>
              </form>

              <div className={styles.divider}>
                <span>OR</span>
              </div>

              <button
                type="button"
                className={styles.btnSecondary}
                onClick={handleGoogleSignIn}
                disabled={isAuthenticating}
              >
                <GoogleIcon size={16} />
                <span>Continue with Google</span>
              </button>
            </div>
          )}

          {/* User IS Signed In */}
          {currentUser && (
            <div>
              {!isEmailMatch ? (
                <div>
                  <div className={`${styles.alertBox} ${styles.alertWarning}`}>
                    <AlertCircleIcon size={18} />
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: "2px" }}>Account Email Mismatch</div>
                      <div>
                        You are currently signed in as <strong>{currentUser.email}</strong>, but this invitation was sent specifically to <strong>{invite.invitedEmail}</strong>.
                      </div>
                    </div>
                  </div>

                  <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "1.25rem", lineHeight: 1.5 }}>
                    To ensure secure organization access control, please switch accounts and sign in with the invited email address.
                  </p>

                  <button
                    type="button"
                    className={styles.btnSecondary}
                    onClick={handleSwitchAccount}
                  >
                    <LogOutIcon size={14} />
                    <span>Sign Out &amp; Switch Account</span>
                  </button>
                </div>
              ) : (
                <div>
                  <div className={`${styles.alertBox} ${styles.alertSuccess}`}>
                    <CheckIcon size={16} />
                    <span>Signed in as verified recipient: <strong>{currentUser.email}</strong></span>
                  </div>

                  {acceptError && (
                    <div className={`${styles.alertBox} ${styles.alertError}`}>
                      <AlertCircleIcon size={16} />
                      <span>{acceptError}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    className={styles.btnPrimary}
                    onClick={handleAcceptInvite}
                    disabled={isAccepting}
                  >
                    {isAccepting ? (
                      <>
                        <SpinnerIcon size={16} />
                        <span>Joining Workspace...</span>
                      </>
                    ) : (
                      <>
                        <TeamIcon size={16} />
                        <span>Accept Invitation &amp; Join Workspace</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    className={styles.btnSecondary}
                    onClick={handleSwitchAccount}
                    disabled={isAccepting}
                  >
                    <LogOutIcon size={14} />
                    <span>Switch Account</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.footer}>
          Operatsi &bull; An OVIC Labs Enterprise Platform &bull; Security Verified
        </div>
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div className={styles.container}>
          <div className={styles.card} style={{ textAlign: "center", padding: "3rem 2rem" }}>
            <SpinnerIcon size={32} />
            <h2 style={{ fontSize: "1.1rem", marginTop: "1rem", color: "var(--text-primary)" }}>
              Loading Invitation...
            </h2>
          </div>
        </div>
      }
    >
      <AcceptInviteContent />
    </Suspense>
  );
}
