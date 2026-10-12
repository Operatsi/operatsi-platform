"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
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
import { auth, db } from "../lib/firebase";
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
import {
  doc,
  setDoc,
  updateDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import styles from "./page.module.css";

type AuthMode = "signin" | "signup" | "forgot" | "verify_otp";

// Generates a 4-character code containing both alphabets and numbers
function generateAlphanumericOtp(length = 4): string {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const numbers = "23456789";
  let result = "";
  // Guarantee both uppercase letters and numbers are present
  result += letters.charAt(Math.floor(Math.random() * letters.length));
  result += numbers.charAt(Math.floor(Math.random() * numbers.length));
  const pool = letters + numbers;
  for (let i = 2; i < length; i++) {
    result += pool.charAt(Math.floor(Math.random() * pool.length));
  }
  return result
    .split("")
    .sort(() => 0.5 - Math.random())
    .join("");
}

export default function LoginPage() {
  // Mode state: 'signin' | 'signup' | 'forgot' | 'verify_otp'
  const [authMode, setAuthMode] = useState<AuthMode>("signin");

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  // OTP Verification states
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [otpValues, setOtpValues] = useState<string[]>(["", "", "", ""]);
  const [resendCountdown, setResendCountdown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [isRequirementsOpen, setIsRequirementsOpen] = useState(false);
  const [isHoveringProgress, setIsHoveringProgress] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (authMode === "verify_otp" && resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [authMode, resendCountdown]);

  // Password validation rules
  const hasMinLength = password.length >= 6;
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password);
  const criteriaMetCount = (hasMinLength ? 1 : 0) + (hasNumber ? 1 : 0) + (hasSymbol ? 1 : 0);
  const isPasswordGreen = hasMinLength && hasNumber && hasSymbol;

  // Show requirements panel only when user explicitly clicks or hovers the progress bar
  const showRequirements = isRequirementsOpen || isHoveringProgress;

  // Legal modal state
  const [legalModal, setLegalModal] = useState<LegalDocType>(null);

  // Auth session & verification states
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isUserVerified, setIsUserVerified] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setIsUserVerified(Boolean(data?.emailVerified));
          } else {
            setIsUserVerified(user.emailVerified);
          }
        } catch {
          setIsUserVerified(user.emailVerified);
        }
      } else {
        setIsUserVerified(false);
      }
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

  // Handle Sign Up submission - creates user in Auth & Firestore (unverified), then initiates 4-character OTP
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
      // 1. Create account in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;

      // 2. Persist user document in Firestore with emailVerified: false
      await setDoc(
        doc(db, "users", newUser.uid),
        {
          uid: newUser.uid,
          name: name.trim() || email.split("@")[0],
          email: email.trim().toLowerCase(),
          authProvider: "password",
          emailVerified: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setIsUserVerified(false);

      // 3. Generate 4-character alphanumeric OTP with letters and numbers
      const otp = generateAlphanumericOtp(4);
      setGeneratedOtp(otp);
      setOtpValues(["", "", "", ""]);
      setResendCountdown(30);
      setAuthMode("verify_otp");
      setSuccessMessage("Account created. Please enter the verification code sent to your email.");
    } catch (err) {
      setErrorMessage(formatAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP input change
  const handleOtpChange = (index: number, val: string) => {
    const char = val.slice(-1).toUpperCase().replace(/[^A-Z0-9]/g, "");
    const updated = [...otpValues];
    updated[index] = char;
    setOtpValues(updated);

    if (char && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle OTP backspace navigation
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle pasting full 4-character code
  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!pasteData) return;
    const updated = [...otpValues];
    for (let i = 0; i < 4; i++) {
      updated[i] = pasteData[i] || "";
    }
    setOtpValues(updated);
    const targetIdx = Math.min(pasteData.length, 3);
    inputRefs.current[targetIdx]?.focus();
  };

  // Resend OTP code
  const handleResendOtp = () => {
    const newCode = generateAlphanumericOtp(4);
    setGeneratedOtp(newCode);
    setOtpValues(["", "", "", ""]);
    setResendCountdown(30);
    setErrorMessage(null);
    setSuccessMessage("A new verification code has been generated.");
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 50);
  };

  // Verify OTP and update Firestore to emailVerified: true
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const enteredCode = otpValues.join("").toUpperCase();
    if (enteredCode.length < 4) {
      setErrorMessage("Please enter all 4 characters of the verification code.");
      return;
    }

    if (enteredCode !== generatedOtp.toUpperCase()) {
      setErrorMessage("Invalid verification code. Please check and try again.");
      return;
    }

    setIsLoading(true);
    try {
      const activeUid = auth.currentUser?.uid;
      if (activeUid) {
        // Update user record in Firestore to emailVerified: true
        await updateDoc(doc(db, "users", activeUid), {
          emailVerified: true,
          updatedAt: serverTimestamp(),
        });
      }
      setIsUserVerified(true);
      setSuccessMessage("Email verified successfully! Your account is active.");
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

  // Handle Google Sign In - saves user data to Firestore with emailVerified: true
  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Save user to Firestore with verified status
      await setDoc(
        doc(db, "users", user.uid),
        {
          uid: user.uid,
          name: user.displayName || user.email?.split("@")[0] || "User",
          email: user.email?.toLowerCase() || "",
          authProvider: "google.com",
          emailVerified: true,
          photoURL: user.photoURL || null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setIsUserVerified(true);
      setSuccessMessage("Signed in with Google successfully!");
    } catch (err) {
      setErrorMessage(formatAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Apple Sign In - saves user data to Firestore with emailVerified: true
  const handleAppleSignIn = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);
    try {
      const provider = new OAuthProvider("apple.com");
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Save user to Firestore with verified status
      await setDoc(
        doc(db, "users", user.uid),
        {
          uid: user.uid,
          name: user.displayName || user.email?.split("@")[0] || "User",
          email: user.email?.toLowerCase() || "",
          authProvider: "apple.com",
          emailVerified: true,
          photoURL: user.photoURL || null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setIsUserVerified(true);
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

  // Unified main logo for all themes (Light and Dark mode)
  const logoSrc = "/OperatSI.png";

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
                src={logoSrc}
                alt="OperatSI"
                width={160}
                height={44}
                priority
                className={styles.logoImage}
              />
            </div>
            {currentUser ? (
              <>
                <h1 className={styles.cardTitle}>Workspace Active</h1>
                <p className={styles.cardSubtitle}>
                  You are currently signed in to OperatSI.
                </p>
              </>
            ) : authMode === "verify_otp" ? (
              <>
                <h1 className={styles.cardTitle}>Verify your email</h1>
                <p className={styles.cardSubtitle}>
                  Enter the 4-character verification code for <strong>{email}</strong>
                </p>
              </>
            ) : authMode === "signin" ? (
              <>
                <h1 className={styles.cardTitle}>Sign in</h1>
                <p className={styles.cardSubtitle}>
                  Welcome back. Please enter your details.
                </p>
              </>
            ) : authMode === "signup" ? (
              <>
                <h1 className={styles.cardTitle}>Create an account</h1>
                <p className={styles.cardSubtitle}>
                  Enter your details to create your workspace.
                </p>
              </>
            ) : (
              <>
                <h1 className={styles.cardTitle}>Reset password</h1>
                <p className={styles.cardSubtitle}>
                  Enter your email to receive recovery instructions.
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
              <div className={styles.workspaceBadge}>
                {isUserVerified ? "Email Verified · Active Workspace" : "Email Unverified · Action Required"}
              </div>
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
              {/* Tab Navigation (Sign In vs Create Account) only in signin/signup modes */}
              {(authMode === "signin" || authMode === "signup") && (
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
              {(authMode === "signin" || authMode === "signup") && (
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
                      Email
                    </label>
                    <div className={styles.inputWrapper}>
                      <input
                        id="login-email"
                        type="email"
                        required
                        placeholder="name@company.com"
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
                      <span>Sign in</span>
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
                      Full name
                    </label>
                    <div className={styles.inputWrapper}>
                      <input
                        id="signup-name"
                        type="text"
                        placeholder="Jane Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={styles.input}
                        autoComplete="name"
                      />
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="signup-email" className={styles.label}>
                      Email
                    </label>
                    <div className={styles.inputWrapper}>
                      <input
                        id="signup-email"
                        type="email"
                        required
                        placeholder="name@company.com"
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
                        placeholder="Create a password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
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

                    {/* Professional Corporate Single Progress Bar */}
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
                        title="Click to toggle requirements checklist"
                      >
                        <div className={styles.strengthBarTrack}>
                          <div
                            className={`${styles.strengthBarFill} ${
                              criteriaMetCount === 0
                                ? styles.fillEmpty
                                : criteriaMetCount === 1
                                ? styles.fillRed
                                : criteriaMetCount === 2
                                ? styles.fillYellow
                                : styles.fillGreen
                            }`}
                            style={{
                              width:
                                criteriaMetCount === 0
                                  ? "0%"
                                  : criteriaMetCount === 1
                                  ? "33.33%"
                                  : criteriaMetCount === 2
                                  ? "66.66%"
                                  : "100%",
                            }}
                          />
                        </div>
                      </button>

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
                    title={!isPasswordGreen ? "Please fulfill all 3 password requirements to create an account" : "Create account"}
                  >
                    {isLoading ? (
                      <>
                        <SpinnerIcon size={18} />
                        <span>Creating Account...</span>
                      </>
                    ) : (
                      <span>Create account</span>
                    )}
                  </button>

                  {!isPasswordGreen && password.length > 0 && (
                    <div className={styles.disabledButtonNotice}>
                      Please fulfill all 3 password requirements to create an account
                    </div>
                  )}

                  <p className={styles.termsNoticeText}>
                    By creating an account, you agree to our{" "}
                    <Link href="/terms" className={styles.legalInlineLink}>
                      Terms of Service
                    </Link>{" "}
                    and acknowledge our{" "}
                    <button
                      type="button"
                      className={styles.legalInlineBtn}
                      onClick={() => setLegalModal("privacy")}
                    >
                      Privacy Policy
                    </button>
                    .
                  </p>

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

              {/* Verify 4-character Alphanumeric OTP Mode */}
              {authMode === "verify_otp" && (
                <form className={styles.form} onSubmit={handleVerifyOtp}>
                  <div className={styles.otpNoticeBanner}>
                    <span>Verification code:</span>
                    <span className={styles.otpCodeBadge}>{generatedOtp}</span>
                  </div>

                  <div className={styles.otpContainer}>
                    {otpValues.map((val, idx) => (
                      <input
                        key={idx}
                        ref={(el) => {
                          inputRefs.current[idx] = el;
                        }}
                        id={`otp-input-${idx}`}
                        type="text"
                        maxLength={1}
                        value={val}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        onPaste={handleOtpPaste}
                        className={`${styles.otpInput} ${val ? styles.otpInputFilled : ""}`}
                        autoFocus={idx === 0}
                        autoComplete="one-time-code"
                      />
                    ))}
                  </div>

                  <div className={styles.otpResendRow}>
                    <span>Didn&apos;t receive the code?</span>
                    <button
                      id="btn-resend-otp"
                      type="button"
                      className={styles.otpResendBtn}
                      onClick={handleResendOtp}
                      disabled={resendCountdown > 0}
                    >
                      {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : "Resend code"}
                    </button>
                  </div>

                  <button
                    id="btn-submit-verify-otp"
                    type="submit"
                    className={styles.submitBtn}
                    disabled={isLoading || otpValues.join("").length < 4}
                  >
                    {isLoading ? (
                      <>
                        <SpinnerIcon size={18} />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <span>Verify and create account</span>
                    )}
                  </button>

                  <div className={styles.switchModeRow}>
                    Entered wrong email?{" "}
                    <button
                      id="btn-back-to-signup"
                      type="button"
                      className={styles.switchModeBtn}
                      onClick={() => {
                        setAuthMode("signup");
                        setErrorMessage(null);
                        setSuccessMessage(null);
                      }}
                    >
                      Change email
                    </button>
                  </div>
                </form>
              )}

              {/* Forgot Password Mode */}
              {authMode === "forgot" && (
                <form className={styles.form} onSubmit={handleResetPassword}>
                  <div className={styles.formGroup}>
                    <label htmlFor="forgot-email" className={styles.label}>
                      Email
                    </label>
                    <div className={styles.inputWrapper}>
                      <input
                        id="forgot-email"
                        type="email"
                        required
                        placeholder="name@company.com"
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
                      <span>Send recovery link</span>
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
          <Link
            id="link-terms-of-service"
            href="/terms"
            className={styles.footerLink}
          >
            Terms of Service
          </Link>
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
        <div className={styles.footerCopyright}>
          © 2026 OperatSI Inc. All rights reserved. An OVIC Labs Company
        </div>
      </footer>

      {/* Terms of Service / Privacy Policy / Help Center Modal */}
      <LegalModal type={legalModal} onClose={() => setLegalModal(null)} />
    </div>
  );
}
