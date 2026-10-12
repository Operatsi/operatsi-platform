# OperatSI Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Security Policy](https://img.shields.io/badge/Security-Policy-green.svg)](SECURITY.md)
[![Code of Conduct](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](CODE_OF_CONDUCT.md)
[![Accessibility](https://img.shields.io/badge/Accessibility-WCAG%202.1%20AA-success.svg)](ACCESSIBILITY.md)
[![Dependabot](https://img.shields.io/badge/Dependabot-Active-0366d6.svg?logo=dependabot)](.github/dependabot.yml)

Operatsi is an AI-native business operating platform for intelligent planning, multi-agent orchestration, cloud browser automation, and autonomous workflow execution. Built for founders, teams, and enterprises by OVIC Labs.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org) (App Router, Turbopack)
- **Frontend**: React + TypeScript
- **Backend / Services**: Firebase (Authentication, Analytics, Firestore)
- **Styling**: Vanilla CSS Modules (Light & Dark Theme Support)

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file based on `.env.example`:

```bash
cp .env.example .env.local
```

Fill in your Firebase configuration keys:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Project Structure

```text
├── src/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── page.module.css
│   │   ├── page.tsx
│   │   └── terms/
│   │       ├── page.tsx          # Corporate Terms of Service
│   │       └── terms.module.css
│   ├── components/
│   │   ├── Icons.tsx
│   │   ├── LegalModal.tsx
│   │   └── ThemeToggle.tsx
│   └── lib/
│       └── firebase.ts
├── public/
├── .env.local
├── .env.example
├── next.config.ts
└── tsconfig.json
```

## Governance & Repository Protection

OperatSI adheres to enterprise-grade repository governance, community standards, and responsible disclosure:

- 🔒 **[Security Policy](SECURITY.md)** — Vulnerability reporting, SLAs, and responsible disclosure
- 📜 **[License](LICENSE)** — MIT License with OVIC Labs copyright notice
- 🤝 **[Code of Conduct](CODE_OF_CONDUCT.md)** — Contributor Covenant v2.1
- 🛠️ **[Contributing Guide](CONTRIBUTING.md)** — Branch protection, conventional commits, and quality standards
- ♿ **[Accessibility Statement](ACCESSIBILITY.md)** — WCAG 2.1 AA and Section 508 compliance
- 💬 **[Support Policy](SUPPORT.md)** — Enterprise and community support guidelines
- 📄 **[Terms of Service](src/app/terms/page.tsx)** — 25-clause corporate legal terms
- 🛡️ **[Privacy Policy](src/app/privacy/page.tsx)** — 24-clause corporate privacy policy

 