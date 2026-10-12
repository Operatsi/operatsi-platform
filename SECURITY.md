# Security Policy

OperatSI, developed by OVIC Labs, considers the security and privacy of our autonomous business operating platform paramount. This document outlines our security governance, supported releases, vulnerability disclosure procedure, and responsible engagement terms.

---

## 1. Supported Versions

We provide active security maintenance, dependency patches, and vulnerability remediations for the releases indicated below.

| Release Channel | Version | Supported | Security Update Cadence |
| :--- | :--- | :---: | :--- |
| **Current / Main** | `0.1.x` (`main`) | ✅ Yes | Immediate / Weekly Dependabot automated triage |
| **Staging / Beta** | `pre-release` | ✅ Yes | Continuous deployment cycle |
| **Legacy Branches** | `< 0.1.0` | ❌ No | Deprecated |

---

## 2. Reporting a Vulnerability

If you discover or suspect a security vulnerability within the OperatSI platform, cloud browser execution sandbox, multi-agent orchestration engine, or Firebase data layer, **please do not open a public GitHub issue.**

### Reporting Channels

1. **Email (Preferred)**: Send an encrypted or confidential report directly to:
   - **Primary Security Desk**: [`security@operatsi.com`](mailto:security@operatsi.com)
   - **Corporate Legal & Privacy**: [`legal@operatsi.com`](mailto:legal@operatsi.com)
2. **GitHub Private Security Advisory**: If you have repository access, navigate to the **Security** tab and click **"Report a vulnerability"** to open a confidential advisory.

### Information to Include

To assist our incident response team in verifying and resolving the vulnerability expeditiously, please provide:
- A detailed description of the vulnerability and its potential attack vector.
- Step-by-step reproduction instructions or a minimal Proof of Concept (PoC).
- Affected components (e.g., authentication routes, Firestore rules, client bundles, cloud browser container).
- Any proposed remediation, patch, or mitigation strategy.

---

## 3. Incident Response SLAs

Our security operations team adheres to the following response timeline:

| Milestone | Target Response Time | Action |
| :--- | :--- | :--- |
| **Initial Acknowledgment** | `< 24 Hours` | Confirm receipt and assign incident commander. |
| **Severity Triage** | `< 72 Hours` | Reproduce vulnerability, assess CVSS rating, and determine scope. |
| **Status Updates** | Every 48–72 Hours | Provide regular progress reports to the reporter. |
| **Remediation & Patch** | Urgent / Immediate | Deploy fix to `main`, release security patch, and push to production. |
| **Public Disclosure** | Coordinated | Publish release notes and credit researcher after patch deployment. |

---

## 4. Scope and Critical Areas

The following surfaces are considered high-priority in the OperatSI architecture:

- **Authentication & Sessions**: Firebase Authentication, OAuth flows (Google, Apple), OTP verification integrity, and token lifecycle.
- **Data Access & Authorization**: Cloud Firestore Security Rules (`firestore.rules`), multi-tenant data isolation, and user profile permissions.
- **Autonomous Agent Execution**: Permission boundaries, tool execution authorization, and prevention of prompt injection escapes.
- **Cloud Browser Automation**: Isolation of remote browser sessions, credential hygiene, and network sandboxing.
- **Client Application Security**: Content Security Policy (CSP), Cross-Site Scripting (XSS), Cross-Site Request Forgery (CSRF), and dependency vulnerabilities.

---

## 5. Safe Harbor & Responsible Research

OperatSI supports ethical security research conducted in good faith. If you conduct your research in accordance with this policy:
- We will not pursue civil action or initiate legal complaints against you regarding your research.
- We will work collaboratively with you to understand and resolve the issue.
- You will be publicly acknowledged in our Security Hall of Fame (upon mutual agreement).

### Guidelines for Safe Harbor:
- Make a good-faith effort to avoid privacy violations, destruction of data, and service degradation (no volumetric DoS/DDoS).
- Only interact with test accounts that you own or have explicit authorization to inspect.
- Do not access, extract, or modify data belonging to other organizations or users.
- Provide us a reasonable opportunity to remediate before disclosing details publicly.

---

## 6. Corporate Contact

**OperatSI Security Operations**  
An OVIC Labs Company  
HITEC City, Hyderabad, Telangana, India  
Email: [security@operatsi.com](mailto:security@operatsi.com)  
Website: [https://github.com/Operatsi/operatsi-platform](https://github.com/Operatsi/operatsi-platform)
