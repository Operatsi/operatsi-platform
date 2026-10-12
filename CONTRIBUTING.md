# Contributing to OperatSI

Thank you for your interest in contributing to **OperatSI**! As an enterprise-grade AI operating platform developed by OVIC Labs, we maintain high standards of code quality, security, accessibility, and documentation integrity.

Please review this guide before submitting issues or pull requests.

---

## 1. Code of Conduct

All contributors and maintainers are expected to adhere to our [Code of Conduct](CODE_OF_CONDUCT.md). Please report unacceptable behavior to [`conduct@operatsi.com`](mailto:conduct@operatsi.com).

---

## 2. Protected Branch Strategy & Git Workflow

The `main` branch is **protected**. Direct pushes to `main` are restricted. All changes must be delivered via Pull Requests that pass automated builds and receive peer reviews.

```text
main (Protected production branch)
  ↑
  └── feat/your-feature-name (Feature branch)
  └── fix/issue-description  (Bugfix branch)
  └── chore/maintenance-task (Maintenance branch)
```

### Branch Naming Conventions

- `feat/feature-name` — New user-facing capabilities or enhancements
- `fix/bug-description` — Patches for defects or unexpected behaviors
- `refactor/scope-name` — Internal code improvements without behavioral changes
- `chore/task-name` — Dependency updates, tooling, or build configuration
- `docs/doc-title` — Documentation and legal policy updates

---

## 3. Local Development Setup

### Prerequisites
- **Node.js**: v20.x or higher LTS
- **npm**: v10.x or higher
- **Git**: v2.40 or higher

### Steps
1. Clone the repository:
   ```bash
   git clone https://github.com/Operatsi/operatsi-platform.git
   cd operatsi-platform
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment configuration:
   ```bash
   cp .env.example .env.local
   ```
4. Start the Turbopack development server:
   ```bash
   npm run dev
   ```
5. Verify at [http://localhost:3000](http://localhost:3000).

---

## 4. Engineering Standards & Quality Gates

Before opening a Pull Request, verify that your branch passes all quality gates locally:

```bash
# 1. Type checking and production bundle verification
npm run build

# 2. Linting verification
npm run lint
```

### Architectural Principles
- **Next.js App Router**: Leverage server components where possible; use `"use client"` only when interactivity or client hooks are needed.
- **TypeScript**: Strict typing without `any`. Maintain complete type definitions for models and component props.
- **Styling**: Use Vanilla CSS Modules (`*.module.css`) with predefined design tokens from `globals.css` (supports dark & light themes).
- **Accessibility**: Ensure keyboard navigable interfaces, visible focus rings, valid color contrast, and proper ARIA labels. See [ACCESSIBILITY.md](ACCESSIBILITY.md).
- **Security**: Never commit sensitive keys, secrets, or `.env.local` credentials. Follow guidelines in [SECURITY.md](SECURITY.md).

---

## 5. Conventional Commits & Co-Authorship

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification for commit history:

```text
<type>(<scope>): <short imperative description>

[optional multi-line body with technical rationale]

[optional co-authorship trailers]
```

### Supported Commit Types:
- `feat`: A new feature
- `fix`: A bug fix
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Performance improvement
- `ci`: CI/CD and Dependabot pipeline changes
- `docs`: Documentation changes
- `chore`: Tooling, dependency, or config updates

### Pair Programming & Co-Authorship
To earn GitHub Pair Programming badges and properly credit collaborators, include standard `Co-authored-by:` trailers separated by an empty line at the bottom of the commit message:

```text
feat(auth): add multi-factor authentication support

Implement biometric WebAuthn verification on login challenge.

Co-authored-by: bungakarunanidhi <127289381+bungakarunanidhi@users.noreply.github.com>
Co-authored-by: Navyal7 <338996693+Navyal7@users.noreply.github.com>
```

---

## 6. Submitting a Pull Request

1. Push your branch to GitHub:
   ```bash
   git push -u origin feat/your-feature-name
   ```
2. Open a Pull Request against the `main` branch.
3. Fill out the corporate Pull Request template:
   - Provide a clear summary of what and why.
   - Attach verification screenshots or reproduction logs.
   - Confirm quality checklists (build, lint, responsive, a11y).
4. Request reviews from designated maintainers.
5. Address any review feedback with additional commits.

---

## 7. Community & Questions

For architecture discussions, technical proposals, or questions:
- Open a [GitHub Discussion](https://github.com/Operatsi/operatsi-platform/discussions)
- Review our [Support Policy](SUPPORT.md)
- Contact engineering leads at [`support@operatsi.com`](mailto:support@operatsi.com)
