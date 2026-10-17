"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/AppLayout";
import {
  CheckIcon,
  SpinnerIcon,
  TrashIcon,
  CloseIcon,
  AlertCircleIcon,
  ChevronRightIcon,
  SearchIcon,
} from "@/components/Icons";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User, deleteUser, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import styles from "../dashboard/dashboard.module.css";

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

export default function SettingsPage() {
  const router = useRouter();

  // User auth and firestore profile details
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userName, setUserName] = useState<string>("");

  // Mobile number & custom country selector states
  const [selectedCountry, setSelectedCountry] = useState<CountryOption>(COUNTRIES[1]);
  const [phoneNational, setPhoneNational] = useState<string>("");
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [isSavingPhone, setIsSavingPhone] = useState(false);
  const [phoneMessage, setPhoneMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const countryDropdownRef = useRef<HTMLDivElement>(null);

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
            if (data?.name) setUserName(data.name);
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

  const handleSavePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setPhoneMessage({
        type: "error",
        text: "You must be signed in to save phone number.",
      });
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

      setPhoneMessage({ type: "success", text: "Saved" });
      setTimeout(() => {
        setPhoneMessage((prev) => (prev?.text === "Saved" ? null : prev));
      }, 4000);
    } catch {
      setPhoneMessage({
        type: "error",
        text: "Could not save mobile number. Please try again.",
      });
    } finally {
      setIsSavingPhone(false);
    }
  };

  // Delete Account State & Handlers
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [unlockTimeLeft, setUnlockTimeLeft] = useState(3);
  const [isDeleteUnlocked, setIsDeleteUnlocked] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const unlockIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (unlockIntervalRef.current) clearInterval(unlockIntervalRef.current);
    };
  }, []);

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
      <div className={styles.settingsLayout}>
        {/* 1. Identity & My Profile Card */}
        <div className={styles.settingsCard}>
          <div className={styles.settingsCardHeader}>
            <h2 className={styles.settingsCardTitle}>My Profile</h2>
          </div>

          <div className={styles.settingsFormRow}>
            {/* User Name */}
            <div className={styles.settingsFormGroup}>
              <div className={styles.settingsLabelRow}>
                <label className={styles.settingsLabel} htmlFor="settings-user-name">
                  User Name
                </label>
              </div>
              <div className={styles.lockedInputWrapper}>
                <input
                  id="settings-user-name"
                  type="text"
                  className={styles.lockedInput}
                  value={activeUserName}
                  readOnly
                  tabIndex={-1}
                  aria-label="User Name (cannot be changed)"
                />
                <div className={styles.fieldTooltip} role="tooltip">
                  You cannot change the name
                </div>
              </div>
            </div>

            {/* Email Address */}
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
                  tabIndex={-1}
                  aria-label="Email Address (cannot be changed)"
                />
                <div className={styles.fieldTooltip} role="tooltip">
                  You cannot change the email
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Phone Number */}
          <form onSubmit={handleSavePhone} className={styles.settingsFormGroup}>
            <div className={styles.settingsLabelRow}>
              <label className={styles.settingsLabel} htmlFor="settings-mobile-phone">
                Mobile Number
              </label>
            </div>

            <div className={styles.phoneInputRow}>
              <div className={styles.phoneInputGroup}>
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

              <button type="submit" className={styles.savePhoneBtn} disabled={isSavingPhone}>
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

            {phoneMessage && (
              <div
                className={
                  phoneMessage.type === "success"
                    ? styles.phoneAlertSuccess
                    : styles.phoneAlertError
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

        {/* 2. Security & Compliance Card */}
        <div className={styles.settingsCard}>
          <div className={styles.settingsCardHeader}>
            <h2 className={styles.settingsCardTitle}>Security &amp; Access</h2>
          </div>
          <div className={styles.settingsFormGroup}>
            <span className={styles.settingsLabel}>Compliance Status</span>
            <div className={styles.statusPill} style={{ alignSelf: "flex-start" }}>
              <span className={styles.pulseDot} />
              <span>SOC2 Type II Certified • Production</span>
            </div>
          </div>
        </div>

        {/* 3. Notifications & Policies Card */}
        <div className={styles.settingsCard}>
          <div className={styles.settingsCardHeader}>
            <h2 className={styles.settingsCardTitle}>Notifications &amp; Policies</h2>
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

        {/* 4. Preferences & API Keys Card */}
        <div className={styles.settingsCard}>
          <div className={styles.settingsCardHeader}>
            <h2 className={styles.settingsCardTitle}>Preferences &amp; API Keys</h2>
          </div>
          <div className={styles.settingsFormGroup}>
            <label className={styles.settingsLabel}>Production API Key</label>
            <input
              type="password"
              className={styles.lockedInput}
              value="opsi_live_9837492817491029481"
              readOnly
              disabled
            />
          </div>
        </div>

        {/* 5. Danger Zone: Delete Account Card */}
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
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className={styles.modalOverlay} onClick={handleCloseDeleteModal}>
          <div className={styles.modalDialog} onClick={(e) => e.stopPropagation()}>
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
                <strong>Warning:</strong> You are about to initiate the permanent deletion of your
                account and all associated Firebase assets.
              </p>
              <ul className={styles.deletionWarningList}>
                <li>All profile records ({activeUserName}, {activeUserEmail})</li>
                <li>Saved mobile numbers and security preferences</li>
                <li>All user activity logs and automated workflows in OperatSI</li>
              </ul>
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.cancelModalBtn}
                onClick={handleCloseDeleteModal}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.confirmDeleteModalBtn}
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
