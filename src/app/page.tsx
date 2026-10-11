"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useTheme } from "../context/ThemeContext";
import { ThemeToggle } from "../components/ThemeToggle";
import {
  GoogleIcon,
  AppleIcon,
  EyeIcon,
  EyeOffIcon,
  SpinnerIcon,
  AlertCircleIcon,
  CheckIcon,
  CloseIcon,
} from "../components/Icons";
import { LegalModal, LegalDocType } from "../components/LegalModal";
import { auth } from "../lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  onAuthStateChanged,
  signOut,
  User,
} from "firebase/auth";
import styles from "./page.module.css";

type AuthMode = "signin" | "signup" | "forgot";

export default function LoginPage() {
  const { resolvedTheme } = useTheme();

  // Mode state: 'signin' | 'signup' | 'forgot'
  const [authMode, setAuthMode] = useState<AuthMode>("signin");

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isRequirementsOpen, setIsRequirementsOpen] = useState(false);
  const [isHoveringProgress, setIsHoveringProgress] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Password validation rules
  const hasMinLength = password.length >= 6;
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password);
  const criteriaMetCount = (hasMinLength ? 1 : 0) + (hasNumber ? 1 : 0) + (hasSymbol ? 1 : 0);
  const isPasswordGreen = hasMinLength && hasNumber && hasSymbol;

  // Show requirements popover when clicked, hovered, or focused
  const showRequirements = isRequirementsOpen || isHoveringProgress || isPasswordFocused;

  // Legal modal state
  const [legalModal, setLegalModal] = useState<LegalDocType>(null);

  // Auth session state
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Format Firebase Auth errors into friendly messages
  const formatAuthError = (err: unknown): string => {
    if (typeof err === "object" && err !== null && "code" in err) {
      const code = (err as { code: string }).code;
      switch (code) {
        case "auth/invalid-email":
          return "Please enter a valid email address.";
        case "auth/user-not-found":
        case "auth/wrong-password":
        case "auth/invalid-credential":
          return "Invalid email or password. Please verify and try again.";
        case "auth/email-already-in-use":
          return "An account with this email already exists. Try signing in.";
        case "auth/weak-password":
          return "Password should be at least 6 characters long.";
        case "auth/popup-closed-by-user":
          return "Sign in popup was closed before finishing.";
        case "auth/network-request-failed":
          return "Network connection issue. Please check your internet connection.";
        case "auth/operation-not-allowed":
          return "This sign-in method is not enabled in Firebase Console yet.";
        default:
          return (err as { message?: string }).message || "Authentication error occurred.";
      }
    }
    return "An unexpected error occurred. Please try again.";
  };

  // Handle Sign In submission
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setSuccessMessage("Signed in successfully! Welcome to OperatSI.");
    } catch (err) {
      setErrorMessage(formatAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Sign Up submission
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email || !password) {
      setErrorMessage("Please fill in both email and password.");
      return;
    }

    if (!isPasswordGreen) {
      setErrorMessage(
        "Password must fulfill all criteria (green progress bar): minimum 6 characters, at least 1 number, and 1 symbol."
      );
      return;
    }

    setIsLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setSuccessMessage("Account created successfully! Welcome aboard.");
    } catch (err) {
      setErrorMessage(formatAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Forgot Password submission
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email) {
      setErrorMessage("Please enter your registered email address.");
      return;
    }

    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMessage(`Password reset link sent to ${email}. Check your inbox!`);
    } catch (err) {
      setErrorMessage(formatAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      setSuccessMessage("Signed in with Google successfully!");
    } catch (err) {
      setErrorMessage(formatAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Apple Sign In
  const handleAppleSignIn = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);
    try {
      const provider = new OAuthProvider("apple.com");
      await signInWithPopup(auth, provider);
      setSuccessMessage("Signed in with Apple successfully!");
    } catch (err) {
      setErrorMessage(formatAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Sign Out
  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOut(auth);
      setSuccessMessage("Signed out successfully.");
    } catch (err) {
      setErrorMessage(formatAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Determine which logo to use based on resolved theme:
  // In Dark Mode use /OperatSI_dark.png, in Light Mode use /OperatSI_light.png
  const logoSrc = resolvedTheme === "dark" ? "/OperatSI_dark.png" : "/OperatSI_light.png";

  return (
    <div className={styles.pageContainer}>
      {/* Top Header with Theme Switcher */}
      <header className={styles.headerBar}>
        <ThemeToggle />
      </header>

      {/* Center Authentication Card */}
      <main className={styles.mainContent}>
        <div className={styles.authCard}>
          {/* Logo & Headline */}
          <div className={styles.brandHeader}>
            <div className={styles.logoWrapper}>
              <Image
                key={logoSrc}
                src={logoSrc}
                alt="OperatSI Logo"
                width={180}
                height={52}
                priority
                className={styles.logoImage}
              />
            </div>
            {currentUser ? (
              <>
                <h1 className={styles.cardTitle}>Workspace Active</h1>
                <p className={styles.cardSubtitle}>
                  You are currently authenticated in OperatSI Autonomous Platform.
                </p>
              </>
            ) : authMode === "signin" ? (
              <>
                <h1 className={styles.cardTitle}>Welcome back</h1>
                <p className={styles.cardSubtitle}>
                  Enter your credentials to access your autonomous workspace
                </p>
              </>
            ) : authMode === "signup" ? (
              <>
                <h1 className={styles.cardTitle}>Create an account</h1>
                <p className={styles.cardSubtitle}>
                  Get started with OperatSI intelligent planning & agent orchestration
                </p>
              </>
            ) : (
              <>
                <h1 className={styles.cardTitle}>Reset password</h1>
                <p className={styles.cardSubtitle}>
                  We&apos;ll send recovery instructions to your email address
                </p>
              </>
            )}
          </div>

          {/* If User Is Already Signed In */}
          {currentUser ? (
            <div className={styles.userSessionCard}>
              <div className={styles.userAvatar}>
                {(currentUser.email?.[0] || "U").toUpperCase()}
              </div>
              <div className={styles.userEmail}>{currentUser.email}</div>
              <div className={styles.workspaceBadge}>OperatSI Platform Core</div>
              <button
                id="btn-sign-out"
                className={styles.signOutBtn}
                onClick={handleSignOut}
                disabled={isLoading}
              >
                Sign Out of Workspace
              </button>
            </div>
          ) : (
            <>
              {/* Tab Navigation (Sign In vs Create Account) when not in forgot password mode */}
              {authMode !== "forgot" && (
                <div className={styles.tabNav} role="tablist">
                  <button
                    id="tab-btn-signin"
                    type="button"
                    role="tab"
                    aria-selected={authMode === "signin"}
                    className={`${styles.tabBtn} ${authMode === "signin" ? styles.activeTab : ""}`}
                    onClick={() => {
                      setAuthMode("signin");
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                  >
                    Sign In
                  </button>
                  <button
                    id="tab-btn-signup"
                    type="button"
                    role="tab"
                    aria-selected={authMode === "signup"}
                    className={`${styles.tabBtn} ${authMode === "signup" ? styles.activeTab : ""}`}
                    onClick={() => {
                      setAuthMode("signup");
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                  >
                    Create Account
                  </button>
                </div>
              )}

              {/* Social Login Options (for sign in and sign up) */}
              {authMode !== "forgot" && (
                <>
                  <div className={styles.socialGrid}>
                    <button
                      id="btn-social-google"
                      type="button"
                      className={styles.socialBtn}
                      onClick={handleGoogleSignIn}
                      disabled={isLoading}
                      aria-label="Continue with Google"
                    >
                      <GoogleIcon size={20} />
                      <span>Google</span>
                    </button>
                    <button
                      id="btn-social-apple"
                      type="button"
                      className={styles.socialBtn}
                      onClick={handleAppleSignIn}
                      disabled={isLoading}
                      aria-label="Continue with Apple"
                    >
                      <AppleIcon size={20} />
                      <span>Apple</span>
                    </button>
                  </div>

                  <div className={styles.divider}>
                    <span>or continue with email</span>
                  </div>
                </>
              )}

              {/* Alerts */}
              {errorMessage && (
                <div className={styles.alertError} role="alert">
                  <AlertCircleIcon size={18} />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className={styles.alertSuccess} role="status">
                  <CheckIcon size={18} />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Form Views */}
              {authMode === "signin" && (
                <form className={styles.form} onSubmit={handleSignIn}>
                  <div className={styles.formGroup}>
                    <label htmlFor="login-email" className={styles.label}>
                      Email address
                    </label>
                    <div className={styles.inputWrapper}>
                      <input
                        id="login-email"
                        type="email"
                        required
                        placeholder="founder@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={styles.input}
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <div className={styles.labelRow}>
                      <label htmlFor="login-password" className={styles.label}>
                        Password
                      </label>
                      <button
                        id="btn-forgot-password-link"
                        type="button"
                        className={styles.forgotLink}
                        onClick={() => {
                          setAuthMode("forgot");
                          setErrorMessage(null);
                          setSuccessMessage(null);
                        }}
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className={styles.inputWrapper}>
                      <input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`${styles.input} ${styles.inputWithToggle}`}
                        autoComplete="current-password"
                      />
                      <button
                        id="btn-toggle-login-password"
                        type="button"
                        className={styles.passwordToggle}
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className={styles.checkboxRow}>
                    <input
                      id="login-remember"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className={styles.checkbox}
                    />
                    <label htmlFor="login-remember" className={styles.checkboxLabel}>
                      Remember this device for 30 days
                    </label>
                  </div>

                  <button
                    id="btn-submit-signin"
                    type="submit"
                    className={styles.submitBtn}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <SpinnerIcon size={18} />
                        <span>Signing In...</span>
                      </>
                    ) : (
                      <span>Sign In to OperatSI</span>
                    )}
                  </button>

                  <div className={styles.switchModeRow}>
                    Don&apos;t have an account?{" "}
                    <button
                      id="btn-switch-to-signup"
                      type="button"
                      className={styles.switchModeBtn}
                      onClick={() => {
                        setAuthMode("signup");
                        setErrorMessage(null);
                        setSuccessMessage(null);
                      }}
                    >
                      Create an account
                    </button>
                  </div>
                </form>
              )}

              {/* Sign Up Mode */}
              {authMode === "signup" && (
                <form className={styles.form} onSubmit={handleSignUp}>
                  <div className={styles.formGroup}>
                    <label htmlFor="signup-name" className={styles.label}>
                      Full Name / Workspace Name
                    </label>
                    <div className={styles.inputWrapper}>
                      <input
                        id="signup-name"
                        type="text"
                        placeholder="Alex Rivera"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={styles.input}
                        autoComplete="name"
                      />
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="signup-email" className={styles.label}>
                      Email address
                    </label>
                    <div className={styles.inputWrapper}>
                      <input
                        id="signup-email"
                        type="email"
                        required
                        placeholder="founder@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={styles.input}
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="signup-password" className={styles.label}>
                      Password
                    </label>
                    <div className={styles.inputWrapper}>
                      <input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="Create a strong password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onFocus={() => setIsPasswordFocused(true)}
                        onBlur={() => setIsPasswordFocused(false)}
                        className={`${styles.input} ${styles.inputWithToggle}`}
                        autoComplete="new-password"
                      />
                      <button
                        id="btn-toggle-signup-password"
                        type="button"
                        className={styles.passwordToggle}
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                      </button>
                    </div>

                    {/* Professional Corporate SaaS Solid 3-Segment Progress Bar */}
                    <div className={styles.strengthSection}>
                      <button
                        id="btn-password-strength-toggle"
                        type="button"
                        className={styles.strengthBarClickable}
                        onClick={() => setIsRequirementsOpen((prev) => !prev)}
                        onMouseEnter={() => setIsHoveringProgress(true)}
                        onMouseLeave={() => setIsHoveringProgress(false)}
                        aria-expanded={showRequirements}
                        aria-label="Toggle password requirements"
                        title="Click to view password requirements"
                      >
                        <div className={styles.strengthSegments}>
                          <div
                            className={`${styles.strengthSegment} ${
                              criteriaMetCount >= 1 ? styles.strengthSegmentRed : ""
                            }`}
                          />
                          <div
                            className={`${styles.strengthSegment} ${
                              criteriaMetCount >= 2 ? styles.strengthSegmentOrange : ""
                            }`}
                          />
                          <div
                            className={`${styles.strengthSegment} ${
                              criteriaMetCount >= 3 ? styles.strengthSegmentGreen : ""
                            }`}
                          />
                        </div>
                      </button>

                      <div className={styles.strengthMetaRow}>
                        <div className={styles.strengthMetaLeft}>
                          <span>Strength:</span>
                          <span
                            className={`${styles.statusPill} ${
                              password.length === 0
                                ? styles.statusPillNone
                                : isPasswordGreen
                                ? styles.statusPillGreen
                                : criteriaMetCount === 2
                                ? styles.statusPillOrange
                                : styles.statusPillRed
                            }`}
                          >
                            {password.length === 0
                              ? "Empty"
                              : isPasswordGreen
                              ? "Strong"
                              : criteriaMetCount === 2
                              ? "Medium"
                              : "Weak"}
                          </span>
                        </div>
                        <button
                          type="button"
                          className={styles.strengthTriggerHint}
                          onClick={() => setIsRequirementsOpen((prev) => !prev)}
                        >
                          {showRequirements ? "Hide rules ▴" : "Click to view rules ▾"}
                        </button>
                      </div>

                      {/* Corporate SaaS Requirements Popover Panel */}
                      {showRequirements && (
                        <div className={styles.saasRequirementsCard} role="tooltip">
                          <div className={styles.popoverHeader}>
                            <span className={styles.popoverTitle}>Password Requirements</span>
                            <button
                              type="button"
                              className={styles.popoverCloseBtn}
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsRequirementsOpen(false);
                              }}
                              aria-label="Close requirements"
                            >
                              <CloseIcon size={14} />
                            </button>
                          </div>

                          <div className={styles.requirementsList}>
                            <div className={styles.requirementRow}>
                              <div
                                className={`${styles.checkBadge} ${
                                  hasMinLength ? styles.checkBadgeMet : styles.checkBadgeUnmet
                                }`}
                              >
                                {hasMinLength ? "✓" : "—"}
                              </div>
                              <span
                                className={hasMinLength ? styles.ruleTextMet : styles.ruleTextUnmet}
                              >
                                Minimum 6 characters
                              </span>
                            </div>

                            <div className={styles.requirementRow}>
                              <div
                                className={`${styles.checkBadge} ${
                                  hasNumber ? styles.checkBadgeMet : styles.checkBadgeUnmet
                                }`}
                              >
                                {hasNumber ? "✓" : "—"}
                              </div>
                              <span
                                className={hasNumber ? styles.ruleTextMet : styles.ruleTextUnmet}
                              >
                                At least 1 numerical digit (0–9)
                              </span>
                            </div>

                            <div className={styles.requirementRow}>
                              <div
                                className={`${styles.checkBadge} ${
                                  hasSymbol ? styles.checkBadgeMet : styles.checkBadgeUnmet
                                }`}
                              >
                                {hasSymbol ? "✓" : "—"}
                              </div>
                              <span
                                className={hasSymbol ? styles.ruleTextMet : styles.ruleTextUnmet}
                              >
                                At least 1 symbol / special character (!@#$...)
                              </span>
                            </div>
                          </div>

                          <div
                            className={`${styles.popoverFooterAlert} ${
                              isPasswordGreen ? styles.alertMet : styles.alertUnmet
                            }`}
                          >
                            {isPasswordGreen
                              ? "✓ All criteria met. Account creation enabled."
                              : "Progress bar must turn green to create account."}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    id="btn-submit-signup"
                    type="submit"
                    className={styles.submitBtn}
                    disabled={isLoading || !isPasswordGreen}
                    title={!isPasswordGreen ? "Turn the progress bar green to enable account creation" : "Create account"}
                  >
                    {isLoading ? (
                      <>
                        <SpinnerIcon size={18} />
                        <span>Creating Account...</span>
                      </>
                    ) : (
                      <span>Create Account</span>
                    )}
                  </button>

                  {!isPasswordGreen && password.length > 0 && (
                    <div className={styles.disabledButtonNotice}>
                      Turn the progress bar green to enable account creation
                    </div>
                  )}

                  <div className={styles.switchModeRow}>
                    Already have an account?{" "}
                    <button
                      id="btn-switch-to-signin"
                      type="button"
                      className={styles.switchModeBtn}
                      onClick={() => {
                        setAuthMode("signin");
                        setErrorMessage(null);
                        setSuccessMessage(null);
                      }}
                    >
                      Sign in
                    </button>
                  </div>
                </form>
              )}

              {/* Forgot Password Mode */}
              {authMode === "forgot" && (
                <form className={styles.form} onSubmit={handleResetPassword}>
                  <div className={styles.formGroup}>
                    <label htmlFor="forgot-email" className={styles.label}>
                      Registered email address
                    </label>
                    <div className={styles.inputWrapper}>
                      <input
                        id="forgot-email"
                        type="email"
                        required
                        placeholder="founder@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={styles.input}
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <button
                    id="btn-submit-reset"
                    type="submit"
                    className={styles.submitBtn}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <SpinnerIcon size={18} />
                        <span>Sending Link...</span>
                      </>
                    ) : (
                      <span>Send Recovery Link</span>
                    )}
                  </button>

                  <div className={styles.switchModeRow}>
                    Remembered your password?{" "}
                    <button
                      id="btn-back-to-signin"
                      type="button"
                      className={styles.switchModeBtn}
                      onClick={() => {
                        setAuthMode("signin");
                        setErrorMessage(null);
                        setSuccessMessage(null);
                      }}
                    >
                      Back to Sign in
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </main>

      {/* Bottom Center Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerLinks}>
          <button
            id="link-terms-of-service"
            type="button"
            className={styles.footerLink}
            onClick={() => setLegalModal("terms")}
          >
            Terms of Service
          </button>
          <span className={styles.footerDot}>·</span>
          <button
            id="link-privacy-policy"
            type="button"
            className={styles.footerLink}
            onClick={() => setLegalModal("privacy")}
          >
            Privacy Policy
          </button>
          <span className={styles.footerDot}>·</span>
          <button
            id="link-help-center"
            type="button"
            className={styles.footerLink}
            onClick={() => setLegalModal("help")}
          >
            Help Center
          </button>
        </div>
      </footer>

      {/* Terms of Service / Privacy Policy / Help Center Modal */}
      <LegalModal type={legalModal} onClose={() => setLegalModal(null)} />
    </div>
  );
}
