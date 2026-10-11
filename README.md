# operatsi-platform

Operatsi is an AI-native business operating platform for intelligent planning, multi-agent orchestration, cloud browser automation, and autonomous workflow execution. Built for founders, teams, and enterprises by OVIC Labs.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org) (App Router, Turbopack)
- **Frontend**: React + TypeScript
- **Backend / Services**: Firebase (Authentication, Analytics, Firestore)
- **Styling**: Vanilla CSS

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
│   │   └── page.tsx
│   └── lib/
│       └── firebase.ts       # Firebase app & analytics initialization
├── public/
├── .env.local
├── .env.example
├── next.config.ts
└── tsconfig.json
```
