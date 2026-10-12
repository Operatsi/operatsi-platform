# Accessibility Statement & Standards

OperatSI, developed by OVIC Labs, is committed to ensuring that our AI-native business operating platform is accessible, inclusive, and usable for everyone, including people with visual, auditory, motor, and cognitive disabilities.

We continuously test and enhance our user interfaces to adhere to the **Web Content Accessibility Guidelines (WCAG) 2.1 Level AA** standards and **Section 508** of the U.S. Rehabilitation Act.

---

## 1. Core Accessibility Principles

Our platform architecture is grounded in the four foundational WCAG pillars:

### I. Perceivable
- **High-Contrast Typography**: All text elements adhere to a minimum contrast ratio of `4.5:1` for regular text and `3:1` for large text across both dark and light modes.
- **Semantic Structure**: Proper HTML5 semantic elements (`<header>`, `<nav>`, `<main>`, `<article>`, `<aside>`, `<footer>`) ensure clear document hierarchies.
- **Color Independence**: Color is never used as the sole indicator of status or error. Progress bars, password criteria, and alert banners feature accompanying icons, text labels, and assistive descriptions.
- **Alternative Text**: Informative non-decorative images and corporate badges feature meaningful `alt` descriptions.

### II. Operable
- **Full Keyboard Navigation**: Every interactive control (buttons, links, inputs, modal triggers, theme switcher) can be navigated, activated, and dismissed using keyboard only (`Tab`, `Shift+Tab`, `Enter`, `Space`, `Escape`).
- **Visible Focus Indicators**: Interactive elements feature high-visibility outline rings (`--input-focus-ring` / `--input-border-focus`) when focused via keyboard.
- **Modal Focus Management**: Dialogs and modals (such as legal agreement modals) trap focus appropriately, lock background scroll, and restore focus upon dismissal with `Escape` or the close trigger.
- **Touch Target Sizing**: All interactive touch targets measure at least `44x44px` on mobile and tablet touchscreens.

### III. Understandable
- **Consistent Layout & Navigation**: Predictable UI patterns, intuitive input labels, and persistent navigation headers.
- **Clear Error Messaging**: Form validation issues (e.g., password complexity, email format, OTP mismatch) are articulated with clear, human-readable instructions and live visual indicators.
- **Input Auto-Advance**: Verification fields (e.g., 4-character alphanumeric OTP session) support smooth input sequencing, backspacing, and automatic focus transitions without disorienting the user.

### IV. Robust
- **ARIA Landmark & Attribute Support**: Proper usage of `aria-label`, `aria-modal`, `aria-labelledby`, `aria-describedby`, and `role="dialog"` or `role="tooltip"`.
- **Screen Reader Compatibility**: Verified with major screen readers including NVDA, JAWS, VoiceOver (macOS / iOS), and TalkBack (Android).
- **Reduced Motion**: Respects the user's operating system preference for `prefers-reduced-motion` to minimize animated transitions.

---

## 2. Testing & Verification Methodology

To maintain compliance, every Pull Request submitted to `main` is evaluated against our accessibility checklist:

1. **Automated Audits**: Regular evaluation using Lighthouse Accessibility Audits and axe-core browser tools.
2. **Keyboard-Only Traversal**: Manual tab audits to ensure logical focus order and absence of keyboard traps.
3. **Contrast Validation**: Automated color token verification against WCAG AA standards.
4. **Screen Reader Verification**: Periodic manual testing of authentication flows, form validation, and complex modals.

---

## 3. Known Considerations & Continuous Improvement

While we strive for comprehensive accessibility, ongoing improvements are actively tracked:
- Dynamic multi-agent canvas visualizations and terminal streams are actively being augmented with enhanced ARIA live regions (`aria-live="polite"`).
- Cloud browser automation previews are receiving enhanced descriptive text readouts for remote browser states.

---

## 4. Accessibility Feedback & Assistance

If you encounter an accessibility barrier or have difficulty accessing any feature on the OperatSI platform, our engineering accessibility team is here to help.

- **Email**: [`accessibility@operatsi.com`](mailto:accessibility@operatsi.com)
- **Corporate Legal**: [`legal@operatsi.com`](mailto:legal@operatsi.com)
- **GitHub Issue**: File an issue using our [Accessibility Issue Template](.github/ISSUE_TEMPLATE/accessibility_issue.yml)

Please include the page URL, assistive technology used (if any), and a description of the barrier encountered. We aim to respond within 2 business days.
