"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "../../components/ThemeToggle";
import styles from "./terms.module.css";

interface SectionData {
  id: string;
  num: number;
  title: string;
  content: React.ReactNode;
}

const sections: SectionData[] = [
  {
    id: "about-operatsi",
    num: 1,
    title: "About Operatsi",
    content: (
      <>
        <p className={styles.paragraph}>
          Operatsi is an AI-native business operating platform designed to help individuals, founders, teams,
          businesses, and enterprises plan, organize, delegate, automate, and execute work.
        </p>
        <p className={styles.paragraph}>Depending on the features available under your subscription, Operatsi may provide:</p>
        <ul className={styles.bulletList}>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>AI-assisted planning, research, and decision support.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>AI agents and multi-agent orchestration.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Automated business workflows and task execution.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Cloud browser automation and web interactions.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Project, task, and team management.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Business documents, reports, and analytics.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Customer relationship management and lead management.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Integrations with third-party applications.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Enterprise administration, permissions, and audit capabilities.</span>
          </li>
        </ul>
        <p className={styles.paragraph}>
          Features may be introduced, modified, restricted, or discontinued in accordance with these Terms and
          applicable law.
        </p>
        <p className={styles.paragraph}>
          We do not guarantee that any particular feature will be continuously available or suitable for every business
          purpose.
        </p>
      </>
    ),
  },
  {
    id: "eligibility",
    num: 2,
    title: "Eligibility",
    content: (
      <>
        <p className={styles.paragraph}>
          You must be at least 18 years old, or the age of legal majority in your jurisdiction if higher, and legally
          capable of entering into a binding agreement to use Operatsi.
        </p>
        <p className={styles.paragraph}>
          If you are registering on behalf of a business, you must have the authority to represent that organization.
        </p>
        <p className={styles.paragraph}>
          You agree to provide accurate registration information and keep your account details current.
        </p>
        <p className={styles.paragraph}>
          We may refuse registration or restrict access where reasonably necessary to comply with applicable law,
          prevent fraud, or protect the Services and their users.
        </p>
      </>
    ),
  },
  {
    id: "account-registration",
    num: 3,
    title: "Account Registration and Authentication",
    content: (
      <>
        <p className={styles.paragraph}>Operatsi may support account registration and sign-in through:</p>
        <ul className={styles.bulletList}>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Email address and password.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Google authentication.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Apple authentication.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Mobile number verification using a one-time password (OTP).</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Additional authentication methods introduced in the future.</span>
          </li>
        </ul>
        <p className={styles.paragraph}>
          You are responsible for maintaining the confidentiality of your credentials and protecting access to your
          account.
        </p>
        <p className={styles.paragraph}>
          You must not share credentials in a manner that circumvents subscription limits, access controls, or
          security restrictions.
        </p>
        <p className={styles.paragraph}>
          You agree to notify us promptly if you become aware of unauthorized access or a security incident involving
          your account.
        </p>
        <p className={styles.paragraph}>
          Operatsi may require email verification, mobile verification, additional authentication, or other reasonable
          security checks.
        </p>
        <p className={styles.paragraph}>We may temporarily restrict access where suspicious activity is detected.</p>
      </>
    ),
  },
  {
    id: "workspaces-and-members",
    num: 4,
    title: "Organizations, Workspaces, and Team Members",
    content: (
      <>
        <p className={styles.paragraph}>Operatsi allows authorized users to create or join organizational workspaces.</p>
        <p className={styles.paragraph}>The person who creates a workspace may initially receive the Owner role.</p>
        <p className={styles.paragraph}>Workspace Owners and authorized Administrators may be able to:</p>
        <ul className={styles.bulletList}>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Invite and remove members.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Assign roles and permissions.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Configure organization settings.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Manage subscriptions and usage.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Access organizational records and activity logs, subject to applicable permissions.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Control enabled integrations and automation capabilities.</span>
          </li>
        </ul>
        <p className={styles.paragraph}>
          Organizations are responsible for ensuring that their administrators and members are authorized to access and
          process information within their workspaces.
        </p>
        <p className={styles.paragraph}>
          If you join a workspace controlled by an organization, that organization may manage your workspace access and
          organizational data.
        </p>
        <p className={styles.paragraph}>
          Operatsi may implement additional verification or authorization requirements for sensitive administrative
          actions.
        </p>
      </>
    ),
  },
  {
    id: "artificial-intelligence-services",
    num: 5,
    title: "Artificial Intelligence Services",
    content: (
      <>
        <p className={styles.paragraph}>
          Operatsi uses artificial intelligence technologies to assist with planning, research, analysis, content
          generation, workflow management, and task execution.
        </p>
        <div className={`${styles.calloutCard} ${styles.calloutWarning}`}>
          <span className={styles.calloutIcon}>⚠️</span>
          <div>
            <strong>AI Output Advisory:</strong> AI-generated information may be incomplete, inaccurate, outdated, or
            unsuitable for a particular purpose. AI-generated content does not automatically constitute professional
            legal, medical, financial, accounting, or other regulated advice.
          </div>
        </div>
        <p className={styles.paragraph}>You acknowledge that:</p>
        <ul className={styles.bulletList}>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>AI outputs may contain errors.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>AI-generated recommendations require appropriate human judgment.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Automated processes may produce unexpected results.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Outputs should be independently reviewed before consequential use.</span>
          </li>
        </ul>
        <p className={styles.paragraph}>
          Operatsi does not guarantee that AI-generated outputs will be error-free, factually accurate, legally
          compliant, or suitable for a specific business decision.
        </p>
        <p className={styles.paragraph}>
          You remain responsible for determining whether outputs are appropriate for your intended use.
        </p>
      </>
    ),
  },
  {
    id: "ai-agents-autonomous-execution",
    num: 6,
    title: "AI Agents and Autonomous Execution",
    content: (
      <>
        <p className={styles.paragraph}>
          Operatsi may provide AI agents capable of planning and performing tasks using authorized tools, workflows,
          applications, and browser environments.
        </p>
        <p className={styles.paragraph}>These capabilities may include:</p>
        <ul className={styles.bulletList}>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Researching information.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Preparing documents.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Organizing business records.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Updating authorized applications.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Managing approved workflows.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Interacting with third-party websites.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Performing other actions within configured permissions.</span>
          </li>
        </ul>
        <p className={styles.paragraph}>
          You authorize Operatsi to process your instructions and perform actions within the permissions you provide.
        </p>
        <p className={styles.paragraph}>
          You are responsible for reviewing agent instructions, selecting appropriate permissions, and monitoring
          consequential activities.
        </p>
        <div className={`${styles.calloutCard} ${styles.calloutInfo}`}>
          <span className={styles.calloutIcon}>🛡️</span>
          <div>
            <strong>High-Risk Action Safeguards:</strong> Certain actions may require explicit human approval,
            including financial transactions, publishing content, sending external communications, modifying critical
            records, or deleting information.
          </div>
        </div>
        <p className={styles.paragraph}>
          Operatsi may decline, interrupt, or require additional authorization for actions that present significant
          security, legal, financial, or operational risks.
        </p>
        <p className={styles.paragraph}>No AI agent is guaranteed to complete every requested task successfully.</p>
      </>
    ),
  },
  {
    id: "cloud-browser-services",
    num: 7,
    title: "Cloud Browser Services",
    content: (
      <>
        <p className={styles.paragraph}>
          Operatsi may provide remotely hosted browser environments to perform authorized web-based activities.
        </p>
        <p className={styles.paragraph}>By using these features, you agree that:</p>
        <ul className={styles.bulletList}>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>You will access only websites, accounts, and information you are authorized to use.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>You will comply with applicable laws and third-party website terms.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>You will not use browser automation to bypass security measures or access restrictions.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>You will not use automation for fraudulent, deceptive, or unauthorized activities.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>You are responsible for reviewing sensitive browser actions before authorizing them.</span>
          </li>
        </ul>
        <p className={styles.paragraph}>
          Cloud browser sessions may generate technical records, including screenshots, activity logs, execution
          results, and session metadata, as described in our Privacy Policy.
        </p>
        <p className={styles.paragraph}>
          Third-party websites may change their interfaces, restrict automated access, require additional verification,
          or become unavailable.
        </p>
        <p className={styles.paragraph}>
          Operatsi is not responsible for the independent availability, policies, or conduct of third-party websites.
        </p>
      </>
    ),
  },
  {
    id: "acceptable-use",
    num: 8,
    title: "Acceptable Use",
    content: (
      <>
        <p className={styles.paragraph}>You agree not to use Operatsi to:</p>
        <ul className={styles.bulletList}>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Violate applicable laws or regulations.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Commit fraud, identity theft, or financial deception.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Access accounts, systems, or information without authorization.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Distribute malware or conduct harmful cyberattacks.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Facilitate phishing, spam, or abusive communications.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Infringe intellectual property or privacy rights.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Process personal information without an appropriate legal basis.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Circumvent platform security controls or subscription restrictions.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Interfere with the operation or security of Operatsi.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Engage in unlawful surveillance or unauthorized data collection.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Use automated agents to perform prohibited or unauthorized actions.</span>
          </li>
        </ul>
        <p className={styles.paragraph}>
          We may investigate suspected violations and take proportionate action, including limiting features, suspending
          accounts, or terminating access.
        </p>
        <p className={styles.paragraph}>
          Where required, we may cooperate with lawful requests from competent authorities.
        </p>
      </>
    ),
  },
  {
    id: "user-content-business-data",
    num: 9,
    title: "User Content and Business Data",
    content: (
      <>
        <p className={styles.paragraph}>
          You retain ownership of the content, files, instructions, records, and business data you submit to Operatsi,
          subject to any rights held by third parties.
        </p>
        <p className={styles.paragraph}>
          You grant Operatsi a limited, non-exclusive right to host, process, transmit, display, and otherwise use your
          content as reasonably necessary to provide, secure, maintain, and support the Services.
        </p>
        <p className={styles.paragraph}>
          You represent that you have the necessary rights and permissions to submit and process such content.
        </p>
        <p className={styles.paragraph}>
          We do not claim ownership of your underlying business information merely because you upload or process it
          through Operatsi.
        </p>
        <p className={styles.paragraph}>Your organization may control access to content stored within its workspace.</p>
        <p className={styles.paragraph}>
          You are responsible for maintaining appropriate backups of business-critical information.
        </p>
      </>
    ),
  },
  {
    id: "ai-generated-outputs",
    num: 10,
    title: "AI-Generated Outputs",
    content: (
      <>
        <p className={styles.paragraph}>
          Subject to applicable law and third-party rights, you may use AI-generated outputs produced through your
          authorized use of Operatsi.
        </p>
        <p className={styles.paragraph}>
          However, AI-generated outputs may not be unique. Other users or systems may independently generate similar
          results.
        </p>
        <p className={styles.paragraph}>
          Operatsi does not guarantee exclusive intellectual property rights in AI-generated content.
        </p>
        <p className={styles.paragraph}>
          You are responsible for reviewing outputs for accuracy, confidentiality, intellectual property compliance, and
          suitability before publishing or relying on them.
        </p>
      </>
    ),
  },
  {
    id: "privacy-data-protection",
    num: 11,
    title: "Privacy and Data Protection",
    content: (
      <>
        <p className={styles.paragraph}>
          We process personal information in accordance with our Privacy Policy and applicable data protection laws,
          including applicable provisions of India&apos;s Digital Personal Data Protection Act, 2023 and its implementing
          rules as they become effective.
        </p>
        <p className={styles.paragraph}>
          Depending on the circumstances, Operatsi and its business customers may have different responsibilities
          concerning personal data processed through organizational workspaces.
        </p>
        <p className={styles.paragraph}>
          Where necessary, separate data processing terms may govern processing performed on behalf of enterprise
          customers.
        </p>
        <p className={styles.paragraph}>
          We implement reasonable technical and organizational safeguards appropriate to the Services and the risks
          involved.
        </p>
        <p className={styles.paragraph}>However, no internet-based service can guarantee absolute security.</p>
        <p className={styles.paragraph}>
          For further information about personal data, retention, cookies, third-party service providers, and
          individual rights, please review our Privacy Policy.
        </p>
      </>
    ),
  },
  {
    id: "third-party-services",
    num: 12,
    title: "Third-Party Services and Integrations",
    content: (
      <>
        <p className={styles.paragraph}>
          Operatsi may integrate with external authentication providers, cloud infrastructure providers, payment
          processors, business applications, and other third-party services.
        </p>
        <p className={styles.paragraph}>
          Your use of third-party services may be subject to their separate terms and privacy policies.
        </p>
        <p className={styles.paragraph}>
          We do not control third-party systems and are not responsible for their independent acts, omissions, outages,
          or policy changes, except to the extent required by applicable law.
        </p>
        <p className={styles.paragraph}>
          You are responsible for ensuring that integrations are appropriately authorized.
        </p>
      </>
    ),
  },
  {
    id: "subscription-billing",
    num: 13,
    title: "Subscription Plans and Billing",
    content: (
      <>
        <p className={styles.paragraph}>
          Operatsi may offer free trials, paid subscriptions, enterprise agreements, and usage-based services.
        </p>
        <p className={styles.paragraph}>
          Available plans, features, usage limits, billing periods, and prices will be presented during subscription
          selection or in an applicable order form.
        </p>
        <p className={styles.paragraph}>
          By purchasing a paid subscription, you authorize the applicable payment processor to collect the displayed
          charges.
        </p>
        <p className={styles.paragraph}>
          Unless expressly stated otherwise, subscription fees are exclusive of applicable taxes, including GST.
        </p>
        <p className={styles.paragraph}>
          Subscriptions may renew automatically where this has been clearly disclosed and authorized.
        </p>
        <p className={styles.paragraph}>
          You may cancel a subscription according to the cancellation terms presented at purchase and in your account
          settings.
        </p>
        <p className={styles.paragraph}>
          Any refunds will be governed by the applicable Refund and Cancellation Policy, the purchase terms, and mandatory
          consumer protection laws.
        </p>
        <p className={styles.paragraph}>
          We will provide notice of material subscription price changes as required by applicable law or contractual
          commitments.
        </p>
      </>
    ),
  },
  {
    id: "usage-limits-fair-use",
    num: 14,
    title: "Usage Limits and Fair Use",
    content: (
      <>
        <p className={styles.paragraph}>Subscription plans may include limits on:</p>
        <ul className={styles.bulletList}>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Team members and seats.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>AI agent execution.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Agent credits or computational usage.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Cloud browser sessions and runtime.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Storage capacity.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Projects, workflows, and business records.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Integrations and other platform resources.</span>
          </li>
        </ul>
        <p className={styles.paragraph}>
          Usage entitlements and applicable measurement rules will be disclosed in the relevant plan documentation.
        </p>
        <p className={styles.paragraph}>
          We may apply reasonable technical limits to protect platform stability, security, and equitable access.
        </p>
        <p className={styles.paragraph}>
          Additional usage may require an upgrade or separately disclosed charges.
        </p>
        <p className={styles.paragraph}>
          We will not impose undisclosed usage charges without an appropriate contractual or billing authorization.
        </p>
      </>
    ),
  },
  {
    id: "intellectual-property",
    num: 15,
    title: "Intellectual Property",
    content: (
      <>
        <p className={styles.paragraph}>
          Operatsi, its software, interface designs, branding, trademarks, documentation, and proprietary technologies
          are owned by or licensed to the applicable OVIC Labs operating entity.
        </p>
        <p className={styles.paragraph}>These Terms do not transfer ownership of Operatsi intellectual property to you.</p>
        <p className={styles.paragraph}>
          You receive a limited, non-exclusive, non-transferable right to access and use the Services during your
          authorized subscription or access period, subject to these Terms.
        </p>
        <p className={styles.paragraph}>
          You must not copy, redistribute, sell, or commercially exploit proprietary Operatsi software except where
          expressly authorized.
        </p>
        <p className={styles.paragraph}>
          Open-source components incorporated into the Services remain subject to their respective licenses.
        </p>
      </>
    ),
  },
  {
    id: "service-availability-maintenance",
    num: 16,
    title: "Service Availability and Maintenance",
    content: (
      <>
        <p className={styles.paragraph}>
          We aim to provide reliable Services but do not guarantee uninterrupted or error-free availability.
        </p>
        <p className={styles.paragraph}>The Services may be affected by:</p>
        <ul className={styles.bulletList}>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Scheduled maintenance.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Infrastructure failures.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Network interruptions.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Third-party service outages.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Security incidents.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Model or browser execution limitations.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Events outside our reasonable control.</span>
          </li>
        </ul>
        <p className={styles.paragraph}>
          We may temporarily suspend functionality where reasonably necessary for maintenance, security, legal
          compliance, or system integrity.
        </p>
        <p className={styles.paragraph}>
          Any specific uptime commitment or service credit arrangement must be set out in a separate applicable
          service-level agreement.
        </p>
      </>
    ),
  },
  {
    id: "security-responsible-disclosure",
    num: 17,
    title: "Security and Responsible Disclosure",
    content: (
      <>
        <p className={styles.paragraph}>
          You must not attempt to compromise Operatsi infrastructure or access data belonging to other users or
          organizations.
        </p>
        <p className={styles.paragraph}>If you discover a potential security vulnerability, please report it responsibly to:</p>
        <div className={`${styles.calloutCard} ${styles.calloutInfo}`}>
          <span className={styles.calloutIcon}>🔒</span>
          <div>
            <strong>Security Contact:</strong>{" "}
            <a href="mailto:security@operatsi.com" className={styles.contactCardLink}>
              security@operatsi.com
            </a>
          </div>
        </div>
        <p className={styles.paragraph}>
          Do not publicly disclose vulnerabilities or access unrelated data before coordinating responsible disclosure.
        </p>
        <p className={styles.paragraph}>
          We may publish a separate Vulnerability Disclosure Policy describing authorized security research.
        </p>
      </>
    ),
  },
  {
    id: "suspension-and-termination",
    num: 18,
    title: "Suspension and Termination",
    content: (
      <>
        <p className={styles.paragraph}>
          You may stop using Operatsi at any time and may request account deletion subject to applicable organizational
          controls, retention obligations, and law.
        </p>
        <p className={styles.paragraph}>We may suspend or terminate access where reasonably necessary due to:</p>
        <ul className={styles.bulletList}>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Material violations of these Terms.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Unauthorized or unlawful activities.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Serious security threats.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Fraudulent conduct.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Non-payment after applicable notice or cure periods.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Legal or regulatory requirements.</span>
          </li>
        </ul>
        <p className={styles.paragraph}>
          Where appropriate and legally permissible, we will provide notice and an opportunity to remedy the issue.
        </p>
        <p className={styles.paragraph}>Following termination, access to the Services may cease.</p>
        <p className={styles.paragraph}>
          Data export, retention, and deletion will be governed by the applicable subscription agreement, Privacy Policy,
          and legal obligations.
        </p>
      </>
    ),
  },
  {
    id: "disclaimers",
    num: 19,
    title: "Disclaimers",
    content: (
      <>
        <div className={`${styles.calloutCard} ${styles.calloutWarning}`}>
          <span className={styles.calloutIcon}>⚖️</span>
          <div>
            <strong>Legal Disclaimer Notice:</strong> To the extent permitted by applicable law, the Services are
            provided on an &quot;as available&quot; and &quot;as is&quot; basis.
          </div>
        </div>
        <p className={styles.paragraph}>We do not warrant that:</p>
        <ul className={styles.bulletList}>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>AI outputs will always be correct.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Autonomous workflows will always complete successfully.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Browser automation will function on every website.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Third-party integrations will remain continuously available.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>The Services will meet every particular business requirement.</span>
          </li>
        </ul>
        <p className={styles.paragraph}>
          Nothing in these Terms excludes warranties, rights, or remedies that cannot lawfully be excluded.
        </p>
      </>
    ),
  },
  {
    id: "limitation-of-liability",
    num: 20,
    title: "Limitation of Liability",
    content: (
      <>
        <div className={`${styles.calloutCard} ${styles.calloutAlert}`}>
          <span className={styles.calloutIcon}>⚠️</span>
          <div>
            <strong>Liability Cap:</strong> To the maximum extent permitted by applicable law, neither party will be
            liable to the other for indirect, incidental, special, consequential, or punitive damages, including lost
            profits or business opportunities, arising from use of the Services.
          </div>
        </div>
        <p className={styles.paragraph}>
          Subject to applicable law and any separately negotiated enterprise agreement, Operatsi&apos;s aggregate
          liability arising from the Services will not exceed the fees paid or payable by the customer for the affected
          Services during the twelve months preceding the event giving rise to the claim.
        </p>
        <p className={styles.paragraph}>
          This limitation does not apply where liability cannot legally be limited, including liability for fraud or
          other non-excludable obligations.
        </p>
        <p className={styles.paragraph}>
          Any additional exclusions or liability arrangements agreed in a signed enterprise contract will take
          precedence to the extent expressly stated.
        </p>
      </>
    ),
  },
  {
    id: "indemnification",
    num: 21,
    title: "Indemnification",
    content: (
      <>
        <p className={styles.paragraph}>
          To the extent permitted by applicable law, business customers agree to indemnify Operatsi against third-party
          claims arising from their unlawful use of the Services, infringement of third-party rights through content they
          submit, or unauthorized actions they direct through the platform.
        </p>
        <p className={styles.paragraph}>
          This obligation does not apply to the extent a claim results from Operatsi&apos;s own unlawful conduct, breach, or
          negligence.
        </p>
        <p className={styles.paragraph}>
          Additional indemnification provisions may be agreed separately for enterprise customers.
        </p>
      </>
    ),
  },
  {
    id: "changes-to-terms",
    num: 22,
    title: "Changes to the Services and Terms",
    content: (
      <>
        <p className={styles.paragraph}>
          We may update these Terms to reflect changes in the Services, legal requirements, security practices, or
          business operations.
        </p>
        <p className={styles.paragraph}>
          For material changes, we will provide reasonable advance notice through the platform, email, or another
          appropriate channel, unless immediate changes are required by law or security circumstances.
        </p>
        <p className={styles.paragraph}>The updated Terms will indicate their effective date.</p>
        <p className={styles.paragraph}>Where legally required, we will obtain renewed consent before applying changes.</p>
      </>
    ),
  },
  {
    id: "governing-law",
    num: 23,
    title: "Governing Law and Dispute Resolution",
    content: (
      <>
        <p className={styles.paragraph}>
          These Terms are governed by the laws of India, without prejudice to any mandatory rights or protections
          available under applicable law.
        </p>
        <p className={styles.paragraph}>
          Subject to mandatory jurisdictional requirements, disputes arising from these Terms will be subject to the
          competent courts located in Hyderabad, Telangana, India.
        </p>
        <p className={styles.paragraph}>
          Before initiating formal proceedings, the parties are encouraged to attempt good-faith resolution through the
          contact details below.
        </p>
        <p className={styles.paragraph}>
          Any arbitration procedure, if adopted, must be separately specified in an enforceable agreement.
        </p>
      </>
    ),
  },
  {
    id: "general-provisions",
    num: 24,
    title: "General Provisions",
    content: (
      <>
        <ul className={styles.bulletList}>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>
              <strong>Entire Agreement:</strong> These Terms, together with incorporated policies and applicable order
              forms, constitute the agreement governing the Services.
            </span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>
              <strong>Severability:</strong> If a provision is found unenforceable, the remaining provisions will continue
              to apply.
            </span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>
              <strong>No Waiver:</strong> Failure to enforce a provision does not waive the right to enforce it later.
            </span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>
              <strong>Assignment:</strong> Rights and obligations may be transferred only as permitted by applicable
              law and contractual arrangements.
            </span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>
              <strong>Relationship:</strong> These Terms do not create an employment, partnership, joint venture, or
              agency relationship between the parties.
            </span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>
              <strong>Order of Precedence:</strong> Where a signed enterprise agreement expressly conflicts with these
              Terms, the enterprise agreement will prevail for the relevant customer and subject matter.
            </span>
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "contact-information",
    num: 25,
    title: "Contact Information",
    content: (
      <>
        <p className={styles.paragraph}>For questions about these Terms, contact:</p>
        <div className={styles.contactGrid}>
          <div className={styles.contactCard}>
            <span className={styles.contactCardLabel}>Entity Name</span>
            <span className={styles.contactCardValue}>Operatsi — An OVIC Labs Company</span>
          </div>
          <div className={styles.contactCard}>
            <span className={styles.contactCardLabel}>Legal Entity</span>
            <span className={styles.contactCardValue}>OVIC Labs Private Limited</span>
          </div>
          <div className={styles.contactCard}>
            <span className={styles.contactCardLabel}>Registered Office</span>
            <span className={styles.contactCardValue}>OVIC Labs HQ, HITEC City, Hyderabad, Telangana, India</span>
          </div>
          <div className={styles.contactCard}>
            <span className={styles.contactCardLabel}>General Support</span>
            <span className={styles.contactCardValue}>
              <a href="mailto:support@operatsi.com" className={styles.contactCardLink}>
                support@operatsi.com
              </a>
            </span>
          </div>
          <div className={styles.contactCard}>
            <span className={styles.contactCardLabel}>Legal Department</span>
            <span className={styles.contactCardValue}>
              <a href="mailto:legal@operatsi.com" className={styles.contactCardLink}>
                legal@operatsi.com
              </a>
            </span>
          </div>
          <div className={styles.contactCard}>
            <span className={styles.contactCardLabel}>Data Privacy Officer</span>
            <span className={styles.contactCardValue}>
              <a href="mailto:privacy@operatsi.com" className={styles.contactCardLink}>
                privacy@operatsi.com
              </a>
            </span>
          </div>
        </div>
      </>
    ),
  },
];

export default function TermsOfServicePage() {
  const [searchFilter, setSearchFilter] = useState("");

  const filteredSections = sections.filter(
    (s) =>
      s.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.num.toString().includes(searchFilter)
  );

  const scrollToTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className={styles.pageWrapper}>
      {/* Top Corporate Nav */}
      <nav className={styles.topNav} aria-label="Main Navigation">
        <div className={styles.navContainer}>
          <Link href="/" className={styles.navBrand} title="OperatSI Home">
            <Image
              src="/OperatSI.png"
              alt="OperatSI"
              width={140}
              height={36}
              priority
              className={styles.logoImage}
            />
          </Link>

          <div className={styles.navActions}>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* Hero Header */}
      <header className={styles.heroSection}>
        <div className={styles.heroContainer}>
          <h1 className={styles.heroTitle}>Terms of Service</h1>
          <div className={styles.heroCompany}>
            <span>Operatsi — An OVIC Labs Company</span>
          </div>

          <div className={styles.metaGrid}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Effective Date</span>
              <span className={styles.metaValue}>12 October 2026</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Last Updated</span>
              <span className={styles.metaValue}>12 October 2026</span>
            </div>
          </div>

          {/* Corporate Welcome Notice Box */}
          <div className={styles.welcomeNotice}>
            <h2 className={styles.welcomeHeading}>Welcome to Operatsi</h2>
            <p className={styles.welcomeText}>
              These Terms of Service (&quot;Terms&quot;) govern your access to and use of the Operatsi website,
              applications, artificial intelligence systems, autonomous agents, cloud browser services, business
              management tools, and related products and services (collectively, the &quot;Services&quot;).
            </p>
            <p className={styles.welcomeText}>
              Operatsi is a business operating platform developed and operated by OVIC Labs Private Limited
              (&quot;Operatsi,&quot; &quot;OVIC Labs,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;).
            </p>
            <p className={styles.welcomeText}>
              By creating an account, accessing the Services, or using any Operatsi functionality, you agree to these
              Terms and acknowledge our Privacy Policy. If you use Operatsi on behalf of a company or organization, you
              represent that you are authorized to accept these Terms on its behalf.
            </p>
            <p className={styles.welcomeText}>
              <span className={styles.highlightText}>
                If you do not agree to these Terms, you must not use the Services.
              </span>
            </p>
          </div>
        </div>
      </header>

      {/* Main Layout: Sticky Sidebar TOC + Article Sections */}
      <main className={styles.mainLayout}>
        {/* Sidebar Table of Contents */}
        <aside className={styles.tocSidebar} aria-label="Table of Contents">
          <div className={styles.tocCard}>
            <div className={styles.tocHeader}>
              <span className={styles.tocTitle}>Table of Contents</span>
              <span className={styles.tocCount}>{sections.length}</span>
            </div>

            <input
              type="text"
              placeholder="Filter sections..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className={styles.tocSearchInput}
              aria-label="Filter sections"
            />

            <nav className={styles.tocList}>
              {filteredSections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className={styles.tocLink}
                >
                  <span className={styles.tocNum}>{section.num}.</span>
                  <span>{section.title}</span>
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Document Content */}
        <div className={styles.docContent}>
          {filteredSections.map((section) => (
            <article key={section.id} id={section.id} className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionNumber}>{section.num}.</span>
                <h3 className={styles.sectionTitle}>{section.title}</h3>
              </div>
              <div>{section.content}</div>
            </article>
          ))}
        </div>
      </main>

      {/* Floating Jump to Top Button */}
      <button
        type="button"
        onClick={scrollToTop}
        className={styles.scrollTopBtn}
        aria-label="Scroll to top"
        title="Scroll to top"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </button>

      {/* Corporate Footer */}
      <footer className={styles.corporateFooter}>
        <div className={styles.footerContainer}>
          <div className={styles.footerTop}>
            <div className={styles.footerBrandSection}>
              <span className={styles.footerBrandTitle}>Operatsi Operating Platform</span>
              <span className={styles.footerBrandSubtitle}>
                AI-Native Autonomous Business Architecture & Workflow Engine
              </span>
            </div>
            <div className={styles.footerNavLinks}>
              <Link href="/" className={styles.footerLink}>
                Sign In
              </Link>
              <Link href="/" className={styles.footerLink}>
                Create Account
              </Link>
              <Link href="/terms" className={styles.footerLink}>
                Terms of Service
              </Link>
              <Link href="/privacy" className={styles.footerLink}>
                Privacy Policy
              </Link>
              <a href="mailto:support@operatsi.com" className={styles.footerLink}>
                Help & Support
              </a>
            </div>
          </div>

          <div className={styles.footerBottom}>
            <div className={styles.footerCopyright}>
              © 2026 Operatsi. All rights reserved. An OVIC Labs Company.
            </div>
            <div className={styles.footerLegalTag}>
              <span>Official Corporate Governance</span>
              <span>•</span>
              <span>Hyderabad, Telangana, India</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
