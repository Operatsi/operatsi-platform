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
  sendEmailVerification,
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

// Generates a 5-digit numeric OTP code (e.g. "74921")
function generate5DigitOtp(): string {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

export default function LoginPage() {
  // Mode state: 'signin' | 'signup' | 'forgot' | 'verify_otp'
  const [authMode, setAuthMode] = useState<AuthMode>("signin");

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  // OTP Verification states (5-digit numeric code)
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [otpValues, setOtpValues] = useState<string[]>(["", "", "", "", ""]);
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
    if (resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

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

  // Auto-initialize 5-digit OTP and send to user's email when an unverified user session is active
  useEffect(() => {
    if (currentUser && !isUserVerified && !generatedOtp) {
      const code = generate5DigitOtp();
      setGeneratedOtp(code);
      setOtpValues(["", "", "", "", ""]);
      setResendCountdown(30);

      if (currentUser.email) {
        fetch("/api/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: currentUser.email,
            otp: code,
            name: currentUser.displayName || currentUser.email.split("@")[0],
          }),
        }).catch((err) => console.warn("Auto-dispatch OTP email error:", err));
      }
    }
  }, [currentUser, isUserVerified, generatedOtp]);

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

      // 3. Generate 5-digit numeric OTP and dispatch to user's email
      const otp = generate5DigitOtp();
      setGeneratedOtp(otp);
      setOtpValues(["", "", "", "", ""]);
      setResendCountdown(30);
      setAuthMode("verify_otp");

      // Send 5-digit security code email
      try {
        await fetch("/api/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), otp, name: name.trim() }),
        });
      } catch (fetchErr) {
        console.warn("send-otp api call:", fetchErr);
      }

      try {
        await sendEmailVerification(newUser);
      } catch (mailErr) {
        console.warn("sendEmailVerification notice:", mailErr);
      }

      setSuccessMessage(`Account created! A 5-digit verification code has been sent to ${email}. Check your email inbox.`);
    } catch (err) {
      setErrorMessage(formatAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle sending verification or password recovery email
  const handleSendVerificationEmail = async (sendPasswordToo = false) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);
    try {
      const targetUser = auth.currentUser;
      const targetEmail = targetUser?.email || email;

      if (!targetEmail) {
        setErrorMessage("No registered email address found to send verification.");
        return;
      }

      if (targetUser) {
        try {
          await sendEmailVerification(targetUser);
        } catch (verErr) {
          console.warn("sendEmailVerification notice:", verErr);
        }
      }

      if (sendPasswordToo) {
        try {
          await sendPasswordResetEmail(auth, targetEmail);
        } catch (resetErr) {
          console.warn("sendPasswordResetEmail notice:", resetErr);
        }
      }

      const freshOtp = generate5DigitOtp();
      setGeneratedOtp(freshOtp);
      setOtpValues(["", "", "", "", ""]);
      setResendCountdown(30);

      // Send 5-digit OTP to user's email
      try {
        await fetch("/api/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: targetEmail.trim(),
            otp: freshOtp,
            name: targetUser?.displayName || name,
          }),
        });
      } catch (apiErr) {
        console.warn("send-otp api call:", apiErr);
      }

      setSuccessMessage(
        sendPasswordToo
          ? `Password reset and 5-digit code sent to ${targetEmail}! Please check your email inbox.`
          : `A 5-digit verification code has been sent to ${targetEmail}! Please check your email inbox.`
      );
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 50);
    } catch (err) {
      setErrorMessage(formatAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP input change (5 numeric digits)
  const handleOtpChange = (index: number, val: string) => {
    const digit = val.slice(-1).replace(/[^0-9]/g, "");
    const updated = [...otpValues];
    updated[index] = digit;
    setOtpValues(updated);

    if (digit && index < 4) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle OTP backspace navigation
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle pasting full 5-digit code
  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").trim().replace(/[^0-9]/g, "").slice(0, 5);
    if (!pasteData) return;
    const updated = [...otpValues];
    for (let i = 0; i < 5; i++) {
      updated[i] = pasteData[i] || "";
    }
    setOtpValues(updated);
    const targetIdx = Math.min(pasteData.length, 4);
    inputRefs.current[targetIdx]?.focus();
  };

  // Resend OTP code
  const handleResendOtp = () => {
    handleSendVerificationEmail(false);
  };

  // Verify OTP and update Firestore to emailVerified: true -> Navigate to Next Page
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const enteredCode = otpValues.join("");
    if (enteredCode.length < 5) {
      setErrorMessage("Please enter all 5 digits of the verification code.");
      return;
    }

    if (enteredCode !== generatedOtp) {
      setErrorMessage("Invalid verification code. The 5-digit code does not match. Please try again.");
      return;
    }

    setIsLoading(true);
    try {
      const activeUid = auth.currentUser?.uid;
      if (activeUid) {
        // Update user record in Firestore to emailVerified: true
        await setDoc(
          doc(db, "users", activeUid),
          {
            uid: activeUid,
            emailVerified: true,
            verifiedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }
      setIsUserVerified(true);
      setSuccessMessage("Email verified successfully! Workspace activated.");
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
        <div className={`${styles.authCard} ${currentUser && isUserVerified ? styles.authCardVerified : ""}`}>
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
            {currentUser && isUserVerified ? (
              <>
                <h1 className={styles.cardTitle}>Workspace Active</h1>
                <p className={styles.cardSubtitle}>
                  OperatSI AI-Native Multi-Agent Business Operating Platform
                </p>
              </>
            ) : currentUser && !isUserVerified ? (
              <>
                <h1 className={styles.cardTitle}>Activate Workspace</h1>
                <p className={styles.cardSubtitle}>
                  Enter the 5-digit code sent to <strong>{currentUser.email}</strong> to activate your workspace.
                </p>
              </>
            ) : authMode === "verify_otp" ? (
              <>
                <h1 className={styles.cardTitle}>Verify your email</h1>
                <p className={styles.cardSubtitle}>
                  Enter the 5-digit verification code sent to <strong>{email}</strong>
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

          {/* If User Is Signed In */}
          {currentUser ? (
            isUserVerified ? (
              /* NEXT PAGE: Active Verified Workspace Dashboard */
              <div className={styles.workspaceDashboard}>
                <div className={styles.dashboardHeader}>
                  <div className={styles.dashboardHeaderInfo}>
                    <div className={styles.dashboardHeaderAvatar}>
                      {(currentUser.email?.[0] || "U").toUpperCase()}
                    </div>
                    <div>
                      <div className={styles.dashboardHeaderTitle}>
                        {currentUser.displayName || currentUser.email?.split("@")[0] || "OperatSI Workspace"}
                      </div>
                      <div className={styles.dashboardHeaderSubtitle}>{currentUser.email}</div>
                    </div>
                  </div>
                  <div className={`${styles.workspaceBadge} ${styles.badgeVerified}`}>
                    <span className={styles.pulseDot} />
                    <span>Email Verified</span>
                  </div>
                </div>

                {/* Telemetry Metrics */}
                <div className={styles.telemetryRow}>
                  <div className={styles.telemetryCol}>
                    <span className={styles.telemetryColLabel}>Environment</span>
                    <span className={styles.telemetryColValue}>Production</span>
                  </div>
                  <div className={styles.telemetryCol}>
                    <span className={styles.telemetryColLabel}>Agents</span>
                    <span className={styles.telemetryColValue}>3 Active</span>
                  </div>
                  <div className={styles.telemetryCol}>
                    <span className={styles.telemetryColLabel}>Security</span>
                    <span className={styles.telemetryColValue}>SOC2 Ready</span>
                  </div>
                </div>

                {/* Quick Launch Modules */}
                <div className={styles.dashboardGrid}>
                  <div className={styles.dashboardModuleCard}>
                    <div className={styles.moduleIcon}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect width="18" height="18" x="3" y="3" rx="2" />
                        <path d="M7 7h10M7 12h10M7 17h6" />
                      </svg>
                    </div>
                    <div className={styles.moduleContent}>
                      <div className={styles.moduleHeaderRow}>
                        <span className={styles.moduleTitle}>Multi-Agent Orchestrator</span>
                        <span className={styles.moduleBadge}>Online</span>
                      </div>
                      <p className={styles.moduleDesc}>
                        Autonomous agent execution graph, task routing, and real-time terminal streaming.
                      </p>
                    </div>
                  </div>

                  <div className={styles.dashboardModuleCard}>
                    <div className={styles.moduleIcon}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="2" x2="22" y1="12" y2="12" />
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                      </svg>
                    </div>
                    <div className={styles.moduleContent}>
                      <div className={styles.moduleHeaderRow}>
                        <span className={styles.moduleTitle}>Cloud Browser Automation</span>
                        <span className={styles.moduleBadge}>Ready</span>
                      </div>
                      <p className={styles.moduleDesc}>
                        Direct sandboxed browser environments with mouse hardware emulation and inspectable DOM.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Dashboard Action Group */}
                <div className={styles.dashboardActionGroup}>
                  <button
                    type="button"
                    className={styles.submitBtn}
                    onClick={() => {
                      alert("Opening OperatSI Multi-Agent Console...");
                    }}
                  >
                    Enter Platform Console →
                  </button>
                  <button
                    id="btn-sign-out"
                    type="button"
                    className={styles.signOutBtn}
                    onClick={handleSignOut}
                    disabled={isLoading}
                  >
                    Sign Out of Workspace
                  </button>
                </div>
              </div>
            ) : (
              /* UNVERIFIED: 5-Digit OTP Activation Screen */
              <div className={styles.userSessionCard}>
                <div className={styles.userAvatar}>
                  {(currentUser.email?.[0] || "U").toUpperCase()}
                </div>
                <div className={styles.userEmail}>{currentUser.email}</div>
                <div className={`${styles.workspaceBadge} ${styles.badgeUnverified}`}>
                  <span className={styles.pulseDot} />
                  <span>Email Unverified · Action Required</span>
                </div>

                {/* Alerts */}
                {errorMessage && (
                  <div className={styles.alertError} role="alert" style={{ width: "100%" }}>
                    <AlertCircleIcon size={18} />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {successMessage && (
                  <div className={styles.alertSuccess} role="status" style={{ width: "100%" }}>
                    <CheckIcon size={18} />
                    <span>{successMessage}</span>
                  </div>
                )}

                {/* 5-Digit Code Verification Form */}
                <form className={styles.form} onSubmit={handleVerifyOtp} style={{ width: "100%" }}>
                  <div className={styles.otpNoticeBanner}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect width="20" height="16" x="2" y="4" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                    <span>A 5-digit verification code has been sent to your email.</span>
                  </div>

                  <div className={styles.otpContainer}>
                    {otpValues.map((val, idx) => (
                      <input
                        key={idx}
                        ref={(el) => {
                          inputRefs.current[idx] = el;
                        }}
                        id={`active-otp-input-${idx}`}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
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

                  <div className={styles.emailActionRow}>
                    <button
                      type="button"
                      className={styles.emailSecondaryBtn}
                      onClick={() => handleSendVerificationEmail(false)}
                      disabled={isLoading || resendCountdown > 0}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect width="20" height="16" x="2" y="4" rx="2" />
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                      </svg>
                      <span>
                        {resendCountdown > 0 ? `Resend Code in ${resendCountdown}s` : "Resend Verification Email & Code"}
                      </span>
                    </button>

                    <button
                      type="button"
                      className={styles.emailSecondaryBtn}
                      onClick={() => handleSendVerificationEmail(true)}
                      disabled={isLoading}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      <span>Send Password &amp; Verification Email</span>
                    </button>
                  </div>

                  <button
                    id="btn-submit-verify-otp"
                    type="submit"
                    className={styles.submitBtn}
                    disabled={isLoading || otpValues.join("").length < 5}
                  >
                    {isLoading ? (
                      <>
                        <SpinnerIcon size={18} />
                        <span>Verifying 5-Digit Code...</span>
                      </>
                    ) : (
                      <span>Verify Code &amp; Activate Workspace →</span>
                    )}
                  </button>

                  <div style={{ marginTop: "1rem" }}>
                    <button
                      id="btn-sign-out"
                      type="button"
                      className={styles.signOutBtn}
                      onClick={handleSignOut}
                      disabled={isLoading}
                    >
                      Sign Out of Workspace
                    </button>
                  </div>
                </form>
              </div>
            )
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
                    <Link href="/privacy" className={styles.legalInlineLink}>
                      Privacy Policy
                    </Link>
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

              {/* Verify 5-Digit Numeric OTP Mode */}
              {authMode === "verify_otp" && (
                <form className={styles.form} onSubmit={handleVerifyOtp}>
                  <div className={styles.otpNoticeBanner}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect width="20" height="16" x="2" y="4" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                    <span>A 5-digit verification code has been sent to <strong>{email}</strong>.</span>
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
                        inputMode="numeric"
                        pattern="[0-9]*"
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

                  <div className={styles.emailActionRow}>
                    <button
                      type="button"
                      className={styles.emailSecondaryBtn}
                      onClick={() => handleSendVerificationEmail(false)}
                      disabled={isLoading || resendCountdown > 0}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect width="20" height="16" x="2" y="4" rx="2" />
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                      </svg>
                      <span>
                        {resendCountdown > 0 ? `Resend Code in ${resendCountdown}s` : "Resend Verification Email & Code"}
                      </span>
                    </button>

                    <button
                      type="button"
                      className={styles.emailSecondaryBtn}
                      onClick={() => handleSendVerificationEmail(true)}
                      disabled={isLoading}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      <span>Send Password &amp; Verification Email</span>
                    </button>
                  </div>

                  <button
                    id="btn-submit-verify-otp"
                    type="submit"
                    className={styles.submitBtn}
                    disabled={isLoading || otpValues.join("").length < 5}
                  >
                    {isLoading ? (
                      <>
                        <SpinnerIcon size={18} />
                        <span>Verifying 5-Digit Code...</span>
                      </>
                    ) : (
                      <span>Verify Code &amp; Activate Workspace →</span>
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
          <Link
            id="link-privacy-policy"
            href="/privacy"
            className={styles.footerLink}
          >
            Privacy Policy
          </Link>
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
