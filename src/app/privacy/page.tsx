"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "../../components/ThemeToggle";
import styles from "./privacy.module.css";

interface SectionData {
  id: string;
  num: number;
  title: string;
  content: React.ReactNode;
}

const sections: SectionData[] = [
  {
    id: "introduction",
    num: 1,
    title: "Introduction",
    content: (
      <>
        <p className={styles.paragraph}>
          Welcome to Operatsi. At Operatsi, we recognize that privacy, confidentiality, transparency, and information
          security are essential to the trust placed in our platform by founders, professionals, businesses, and
          enterprises.
        </p>
        <p className={styles.paragraph}>
          This Privacy Policy explains how OVIC Labs Private Limited, operating the Operatsi platform under the OVIC Labs
          brand (&quot;Operatsi,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), collects, uses, stores, shares,
          retains, and protects personal information when you access or use our websites, applications, artificial
          intelligence services, automated agents, cloud browser environments, and related services (collectively, the
          &quot;Services&quot;).
        </p>
        <p className={styles.paragraph}>
          It also explains your privacy choices and rights under applicable data protection laws.
        </p>
        <p className={styles.paragraph}>
          By using Operatsi, you acknowledge that you have been provided this Privacy Policy. Where applicable law requires
          consent for particular processing activities, we will request that consent separately.
        </p>
        <h4 className={styles.subHeading}>Our Privacy Principles</h4>
        <p className={styles.paragraph}>We aim to follow these principles:</p>
        <ul className={styles.bulletList}>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Transparency about information collection and processing.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Collection of information reasonably necessary for specified purposes.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Appropriate security and access controls.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Respect for user and organizational data ownership.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Responsible development and operation of AI systems.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Meaningful privacy choices and user controls.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Appropriate retention and deletion practices.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Compliance with applicable privacy and data protection requirements.</span>
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "scope-of-policy",
    num: 2,
    title: "Scope of This Policy",
    content: (
      <>
        <p className={styles.paragraph}>This Privacy Policy applies to personal information processed through:</p>
        <ul className={styles.bulletList}>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Operatsi websites and web applications.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Account registration and authentication.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Company and organizational workspaces.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>AI conversations and AI-assisted operations.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Nano Agents and multi-agent workflows.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Cloud Browser automation.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Project and task management.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Business documents and file storage.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Customer relationship management features.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Subscription and billing services.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Customer support and platform communications.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Integrations with authorized third-party services.</span>
          </li>
        </ul>
        <p className={styles.paragraph}>
          This Policy does not replace the privacy policies of external websites or third-party applications that users
          access through Operatsi.
        </p>
      </>
    ),
  },
  {
    id: "information-we-collect",
    num: 3,
    title: "Information We Collect",
    content: (
      <>
        <p className={styles.paragraph}>
          We collect different categories of information depending on how you interact with the Services.
        </p>

        <h4 className={styles.subHeading}>3.1 Account and Identity Information</h4>
        <p className={styles.paragraph}>When you create or manage an account, we may collect:</p>
        <ul className={styles.bulletList}>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Full name, email address, mobile phone number, country or region, and profile photograph.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Account identifiers and authentication provider information.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Email and mobile verification status.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Account creation and last-login timestamps.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Security and account recovery information.</span>
          </li>
        </ul>
        <p className={styles.paragraph}>
          When you sign in through Google or Apple, we may receive account information permitted by your provider
          settings and authorization choices. Operatsi does not need to receive or store your Google or Apple account
          password. When email/password authentication is handled by Firebase Authentication, Operatsi&apos;s
          application database should not store your plaintext password.
        </p>

        <h4 className={styles.subHeading}>3.2 Organization and Workspace Information</h4>
        <p className={styles.paragraph}>When you create or join a company workspace, we may collect:</p>
        <ul className={styles.bulletList}>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Organization name, business email address, industry or category, and size.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Business location and your job title or role.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Workspace membership, permissions, department, and team information.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Administrative preferences, invitation, and membership records.</span>
          </li>
        </ul>
        <p className={styles.paragraph}>
          Workspace administrators may be able to view and manage information associated with their organization,
          subject to configured permissions and applicable law.
        </p>

        <h4 className={styles.subHeading}>3.3 AI Conversations and Instructions</h4>
        <p className={styles.paragraph}>When you interact with Operatsi AI, we may process:</p>
        <ul className={styles.bulletList}>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Prompts and instructions, conversation messages, and uploaded reference materials.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Generated responses, selected AI tools, and agent configurations.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Conversation and execution identifiers, feedback, and corrections.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Relevant context required to complete authorized tasks.</span>
          </li>
        </ul>
        <p className={styles.paragraph}>
          This information may be processed by AI systems to generate responses, execute workflows, and provide
          requested functionality.
        </p>

        <h4 className={styles.subHeading}>3.4 Nano Agent and Workflow Data</h4>
        <p className={styles.paragraph}>When you use autonomous or semi-autonomous AI agents, we may process:</p>
        <ul className={styles.bulletList}>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Task descriptions, objectives, execution plans, and agent assignments.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Tool calls, execution results, and approval decisions.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Workflow status, timestamps, generated reports, documents, and error records.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Activity and audit logs to operate workflows and maintain accountability.</span>
          </li>
        </ul>

        <h4 className={styles.subHeading}>3.5 Cloud Browser Information</h4>
        <p className={styles.paragraph}>
          When you authorize Operatsi to perform activities through a hosted browser, the Services may process:
        </p>
        <ul className={styles.bulletList}>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Website URLs, navigation events, and browser session identifiers.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Screenshots, page content, interaction events, and task execution logs.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Downloaded and uploaded files, and information entered into authorized websites.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Session recordings (where enabled) and browser diagnostic information.</span>
          </li>
        </ul>
        <div className={`${styles.calloutCard} ${styles.calloutInfo}`}>
          <span className={styles.calloutIcon}>🌐</span>
          <div>
            <strong>Cloud Browser Safeguards:</strong> We restrict access through authorization controls, workspace
            isolation, appropriate retention settings, and technical safeguards. Browser automation may interact with
            third-party websites governed by their own terms and privacy policies.
          </div>
        </div>

        <h4 className={styles.subHeading}>3.6 Business and Customer Information</h4>
        <p className={styles.paragraph}>Depending on enabled features, customers may upload or manage:</p>
        <ul className={styles.bulletList}>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Customer names and contact details, leads, and sales opportunities.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Business documents, project records, employee details, and operational reports.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Business transactions and related records entered into authorized workflows.</span>
          </li>
        </ul>
        <p className={styles.paragraph}>
          Business customers are responsible for ensuring they have an appropriate legal basis and authority to process
          personal information through Operatsi.
        </p>

        <h4 className={styles.subHeading}>3.7 Files and Uploaded Documents</h4>
        <p className={styles.paragraph}>
          We may process documents and files you upload, including PDFs, Word documents, spreadsheets, presentations,
          images, text files, and reports to support document management, retrieval, AI analysis, and workflow execution.
        </p>

        <h4 className={styles.subHeading}>3.8 Technical and Usage Information</h4>
        <p className={styles.paragraph}>
          We may automatically collect IP address, browser type and version, operating system, device type, session
          timestamps, authentication events, application performance data, feature usage, error logs, and approximate
          location inferred from IP address to maintain performance, prevent abuse, and protect accounts.
        </p>

        <h4 className={styles.subHeading}>3.9 Subscription and Payment Information</h4>
        <p className={styles.paragraph}>
          When purchasing a subscription, we process billing name, address, tax information, subscription plan, and
          transaction identifiers. Payment card information is handled directly by authorized payment processors.
          Operatsi does not store complete payment card numbers or CVV codes in its database.
        </p>
      </>
    ),
  },
  {
    id: "how-we-use-information",
    num: 4,
    title: "How We Use Personal Information",
    content: (
      <>
        <p className={styles.paragraph}>We process personal information for purposes including:</p>
        <ul className={styles.bulletList}>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Creating and managing user accounts, authenticating users, and verifying contact details.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Providing organization and workspace functionality.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Delivering AI-generated responses, authorized workflows, and Nano Agent sessions.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Operating cloud browser sessions and processing uploaded files.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Maintaining project, task, and collaboration features.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Managing subscriptions, invoices, and payment processing.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Providing technical support, monitoring performance, and diagnosing errors.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Detecting fraud, abuse, and unauthorized access.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Maintaining audit trails and operational accountability.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Sending important account and security notifications.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Complying with applicable legal obligations and improving the Services.</span>
          </li>
        </ul>
        <p className={styles.paragraph}>
          We will not use personal information for unrelated purposes without an appropriate legal basis or authorization.
        </p>
      </>
    ),
  },
  {
    id: "legal-basis-for-processing",
    num: 5,
    title: "Legal Basis for Processing",
    content: (
      <>
        <p className={styles.paragraph}>
          Our legal basis for processing personal information depends on the relevant jurisdiction, the type of
          information, and the purpose of processing.
        </p>
        <p className={styles.paragraph}>
          Where applicable under Indian law, processing will be based on valid consent or another ground permitted by
          applicable legislation, including the Digital Personal Data Protection Act, 2023.
        </p>
        <p className={styles.paragraph}>
          Where the European Union or United Kingdom data protection framework applies, our legal bases may include:
        </p>
        <ul className={styles.bulletList}>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Performance of a contract.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Compliance with legal obligations.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Legitimate interests, where permitted and appropriately balanced.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Consent, where required.</span>
          </li>
        </ul>
        <p className={styles.paragraph}>
          For organizational data processed on behalf of business customers, the customer may determine the purposes and
          means of processing, while Operatsi processes information under the applicable agreement and instructions.
        </p>
      </>
    ),
  },
  {
    id: "authentication-otp",
    num: 6,
    title: "Authentication and Mobile OTP Verification",
    content: (
      <>
        <p className={styles.paragraph}>
          Operatsi may use Firebase Authentication to support email/password authentication, Google sign-in, Apple
          sign-in, email verification, mobile number verification, and account recovery.
        </p>
        <p className={styles.paragraph}>
          When you verify a mobile number, your phone number and related verification information may be processed by
          Firebase and its supporting infrastructure to send and validate an SMS one-time password.
        </p>
        <p className={styles.paragraph}>
          SMS verification may involve telecommunications providers and other service providers necessary to deliver the
          verification message.
        </p>
        <p className={styles.paragraph}>
          We use mobile verification information for account security, identity confirmation, and authorized account
          recovery purposes. We do not treat a verified mobile number as permission to send unrelated marketing messages.
        </p>
      </>
    ),
  },
  {
    id: "artificial-intelligence-processing",
    num: 7,
    title: "Artificial Intelligence and Model Processing",
    content: (
      <>
        <p className={styles.paragraph}>
          Operatsi may use self-hosted or otherwise authorized AI models to provide intelligent planning, research,
          document analysis, and automated task execution.
        </p>
        <p className={styles.paragraph}>AI processing may involve:</p>
        <ul className={styles.bulletList}>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Understanding user instructions and retrieving relevant authorized information.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Generating text, structured outputs, and execution plans.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Selecting approved tools, analyzing documents and images, and validating workflows.</span>
          </li>
        </ul>
        <p className={styles.paragraph}>
          AI-generated outputs may contain inaccuracies and should be reviewed before consequential use.
        </p>

        <h4 className={styles.subHeading}>7.1 AI Model Training</h4>
        <div className={`${styles.calloutCard} ${styles.calloutInfo}`}>
          <span className={styles.calloutIcon}>🔒</span>
          <div>
            <strong>No Customer Data Model Training:</strong> Customer prompts, conversations, uploaded files, and
            confidential business data are not used to train or fine-tune general-purpose AI models without separate,
            explicit authorization. Operational processing necessary to provide requested AI functionality is distinct
            from using customer data to train general-purpose models.
          </div>
        </div>

        <h4 className={styles.subHeading}>7.2 Human Review</h4>
        <p className={styles.paragraph}>
          Authorized personnel may access limited information where necessary for customer support, security
          investigations, abuse prevention, or other lawful purposes. Such access is strictly governed by role-based
          permissions, confidentiality requirements, and audit logging.
        </p>
      </>
    ),
  },
  {
    id: "cloud-browser-privacy",
    num: 8,
    title: "Cloud Browser Privacy",
    content: (
      <>
        <p className={styles.paragraph}>
          Operatsi may provide cloud-hosted browser environments that interact with websites and applications at your
          direction. Cloud browser operations may involve processing information displayed on web pages or entered during
          authorized workflows.
        </p>
        <p className={styles.paragraph}>We aim to implement:</p>
        <ul className={styles.bulletList}>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Isolated browser execution environments.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Restricted access to session information.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Secure handling of authentication credentials.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Controls for sensitive actions.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Logging of authorized execution activity.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Appropriate session expiration and cleanup.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Configurable retention for screenshots and recordings, where supported.</span>
          </li>
        </ul>
        <p className={styles.paragraph}>
          You should not instruct Operatsi to access information or systems without proper authorization. Where possible,
          sensitive browser credentials and session information should be stored securely and excluded from unnecessary
          logs or recordings.
        </p>
      </>
    ),
  },
  {
    id: "data-storage-infrastructure",
    num: 9,
    title: "Data Storage and Infrastructure",
    content: (
      <>
        <p className={styles.paragraph}>
          Operatsi may use third-party infrastructure providers to host and operate the Services. The planned
          infrastructure includes:
        </p>
        <ul className={styles.bulletList}>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>
              <strong>Firebase Authentication:</strong> Account authentication and identity verification.
            </span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>
              <strong>Supabase PostgreSQL / Cloud Firestore:</strong> Application and organization data.
            </span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>
              <strong>Cloudflare R2:</strong> File and object storage.
            </span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>
              <strong>AI Inference Infrastructure:</strong> Processing AI requests using authorized models.
            </span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>
              <strong>Cloud Browser Infrastructure:</strong> Running authorized browser sessions.
            </span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>
              <strong>Monitoring and Security Services:</strong> Detecting errors and protecting the platform.
            </span>
          </li>
        </ul>
        <p className={styles.paragraph}>
          Information may be processed in different countries depending on the infrastructure region, provider
          configuration, and applicable legal requirements.
        </p>
      </>
    ),
  },
  {
    id: "information-sharing",
    num: 10,
    title: "Information Sharing and Disclosure",
    content: (
      <>
        <div className={`${styles.calloutCard} ${styles.calloutInfo}`}>
          <span className={styles.calloutIcon}>🛡️</span>
          <div>
            <strong>We Do Not Sell Personal Information:</strong> Operatsi does not sell personal information to data
            brokers or advertisers.
          </div>
        </div>
        <p className={styles.paragraph}>We may share information with:</p>

        <h4 className={styles.subHeading}>10.1 Service Providers</h4>
        <p className={styles.paragraph}>
          Authorized vendors that support authentication, hosting, storage, payment processing, communications,
          monitoring, and other necessary operations.
        </p>

        <h4 className={styles.subHeading}>10.2 Workspace Administrators</h4>
        <p className={styles.paragraph}>
          Authorized organization administrators who manage company accounts, members, settings, and business information.
        </p>

        <h4 className={styles.subHeading}>10.3 User-Authorized Integrations</h4>
        <p className={styles.paragraph}>
          External applications and websites that you or your organization authorize Operatsi to access.
        </p>

        <h4 className={styles.subHeading}>10.4 Legal and Regulatory Authorities</h4>
        <p className={styles.paragraph}>
          Competent authorities where disclosure is required by applicable law, valid legal process, or other lawful
          obligations.
        </p>

        <h4 className={styles.subHeading}>10.5 Business Transactions</h4>
        <p className={styles.paragraph}>
          Relevant parties in connection with a merger, acquisition, restructuring, or transfer of business assets, subject
          to applicable confidentiality and data protection requirements.
        </p>
        <p className={styles.paragraph}>
          We require appropriate safeguards when third parties process personal information on our behalf.
        </p>
      </>
    ),
  },
  {
    id: "cookies-technologies",
    num: 11,
    title: "Cookies and Similar Technologies",
    content: (
      <>
        <p className={styles.paragraph}>Operatsi may use cookies and related technologies for:</p>
        <ul className={styles.bulletList}>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Authentication and session management.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Security and fraud prevention.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Remembering language and appearance preferences (e.g. Dark/Light theme).</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Maintaining application functionality and measuring performance.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Understanding product usage, where permitted.</span>
          </li>
        </ul>
        <p className={styles.paragraph}>
          Cookies may be classified as strictly necessary, functional, analytics, or other categories depending on their
          purpose. Where applicable law requires consent for non-essential cookies, we will provide appropriate consent
          controls.
        </p>
      </>
    ),
  },
  {
    id: "data-security",
    num: 12,
    title: "Data Security",
    content: (
      <>
        <p className={styles.paragraph}>
          We aim to implement technical and organizational safeguards appropriate to the sensitivity of the information
          processed, including:
        </p>
        <ul className={styles.bulletList}>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Encryption in transit (TLS 1.3) and encryption at rest (AES-256).</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Secure authentication and token verification.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Role-based access controls and organization-level data isolation.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Restricted administrative privileges and secrets management.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Security monitoring, audit logging, software updates, and vulnerability management.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Backups, disaster recovery procedures, and browser session isolation.</span>
          </li>
        </ul>
        <p className={styles.paragraph}>
          No internet-based system is completely immune to security risks. We encourage users to protect their credentials
          and report suspected security incidents promptly.
        </p>
      </>
    ),
  },
  {
    id: "data-retention",
    num: 13,
    title: "Data Retention",
    content: (
      <>
        <p className={styles.paragraph}>
          We retain personal information only for as long as reasonably necessary to provide the Services, fulfill the
          purposes described in this Policy, meet legal obligations, resolve disputes, and maintain security.
        </p>
        <p className={styles.paragraph}>Different categories of information have different retention periods:</p>

        <div className={styles.tableWrapper}>
          <table className={styles.retentionTable}>
            <thead>
              <tr>
                <th>Data Category</th>
                <th>Retention Approach</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={styles.categoryCell}>Account information</td>
                <td>While the account remains active, plus applicable legal retention requirements</td>
              </tr>
              <tr>
                <td className={styles.categoryCell}>Organization records</td>
                <td>According to workspace lifecycle and applicable agreements</td>
              </tr>
              <tr>
                <td className={styles.categoryCell}>AI conversations</td>
                <td>According to configured retention settings and applicable obligations</td>
              </tr>
              <tr>
                <td className={styles.categoryCell}>Uploaded files</td>
                <td>Until deletion, workspace termination, or applicable retention expiry</td>
              </tr>
              <tr>
                <td className={styles.categoryCell}>Browser screenshots & recordings</td>
                <td>According to configured session retention rules</td>
              </tr>
              <tr>
                <td className={styles.categoryCell}>Security and audit logs</td>
                <td>For a documented security and compliance retention period</td>
              </tr>
              <tr>
                <td className={styles.categoryCell}>Billing and tax records</td>
                <td>As required by applicable accounting and tax laws</td>
              </tr>
              <tr>
                <td className={styles.categoryCell}>Support communications</td>
                <td>As reasonably necessary for support and legal purposes</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className={styles.paragraph}>
          Deleted information may remain temporarily in backups until scheduled backup expiration, subject to applicable
          legal requirements.
        </p>
      </>
    ),
  },
  {
    id: "account-data-deletion",
    num: 14,
    title: "Account and Data Deletion",
    content: (
      <>
        <p className={styles.paragraph}>
          You may request deletion of your personal account through available account settings or by contacting our privacy
          team.
        </p>
        <p className={styles.paragraph}>
          Depending on your role and organizational relationship, deletion of a personal account may not automatically
          delete business records controlled by an organization.
        </p>
        <p className={styles.paragraph}>
          Workspace Owners or authorized administrators may request deletion of organizational data subject to applicable
          contractual, legal, and operational requirements.
        </p>
        <p className={styles.paragraph}>
          We may retain limited information where necessary to comply with law, resolve disputes, investigate security
          incidents, or enforce legal rights. Where applicable, we will provide confirmation or information about the
          status of a deletion request.
        </p>
      </>
    ),
  },
  {
    id: "your-privacy-rights",
    num: 15,
    title: "Your Privacy Rights",
    content: (
      <>
        <p className={styles.paragraph}>Depending on your location and applicable law, you may have rights to:</p>
        <ul className={styles.bulletList}>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Request access to personal information.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Request correction or updating of inaccurate information.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Request deletion of eligible information.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Withdraw consent where processing is based on consent.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Request information about processing activities.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Raise privacy complaints.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Exercise additional rights provided by applicable law.</span>
          </li>
        </ul>
        <p className={styles.paragraph}>
          Where the GDPR or UK GDPR applies, additional rights may include data portability, restriction of processing,
          objection to certain processing, and protections relating to certain automated decisions.
        </p>
        <p className={styles.paragraph}>
          Requests may be subject to identity verification and lawful exceptions. For information controlled by your
          employer or another organization, we may refer the request to the relevant organization.
        </p>
      </>
    ),
  },
  {
    id: "international-data-transfers",
    num: 16,
    title: "International Data Transfers",
    content: (
      <>
        <p className={styles.paragraph}>
          Operatsi may use infrastructure or service providers located outside your country. Where personal information is
          transferred internationally, we will implement safeguards required by applicable law.
        </p>
        <p className={styles.paragraph}>
          These may include contractual protections, access restrictions, transfer assessments, or other legally
          recognized mechanisms. International transfers will also be subject to applicable Indian legal restrictions and
          requirements.
        </p>
      </>
    ),
  },
  {
    id: "childrens-privacy",
    num: 17,
    title: "Children's Privacy",
    content: (
      <>
        <p className={styles.paragraph}>
          Operatsi is intended for individuals aged 18 years or older. We do not knowingly offer accounts to children under
          18.
        </p>
        <p className={styles.paragraph}>
          If we become aware that an account was created by an ineligible child, we may take appropriate steps to restrict
          or delete the account and associated information, subject to applicable law.
        </p>
      </>
    ),
  },
  {
    id: "automated-decisions",
    num: 18,
    title: "Automated Decisions and Human Oversight",
    content: (
      <>
        <p className={styles.paragraph}>
          Operatsi may use AI systems to recommend, prioritize, organize, or execute business activities. We aim to
          provide human oversight and approval controls for consequential automated actions.
        </p>
        <p className={styles.paragraph}>
          Users and organizations are responsible for determining appropriate review and authorization procedures for
          their use cases. Where applicable law provides rights concerning automated decision-making, we will comply with
          those requirements.
        </p>
      </>
    ),
  },
  {
    id: "data-breach-response",
    num: 19,
    title: "Data Breach and Incident Response",
    content: (
      <>
        <p className={styles.paragraph}>
          If a security incident involving personal information occurs, we will investigate and take appropriate measures
          to contain and address the incident.
        </p>
        <p className={styles.paragraph}>
          Where legally required, we will notify affected individuals and relevant authorities within applicable
          timeframes. Notifications may include information about the nature of the incident, potential risks, and
          recommended protective measures.
        </p>
      </>
    ),
  },
  {
    id: "third-party-websites",
    num: 20,
    title: "Third-Party Websites and Services",
    content: (
      <>
        <p className={styles.paragraph}>
          Operatsi may contain links to or integrations with external websites, applications, and services. Those third
          parties may collect or process information under their own privacy policies.
        </p>
        <p className={styles.paragraph}>
          We encourage users to review third-party privacy practices before connecting accounts or sharing information.
          Operatsi does not control the independent privacy practices of third-party websites.
        </p>
      </>
    ),
  },
  {
    id: "marketing-communications",
    num: 21,
    title: "Marketing Communications",
    content: (
      <>
        <p className={styles.paragraph}>We may send service-related communications, including:</p>
        <ul className={styles.bulletList}>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Account verification messages and security alerts.</span>
          </li>
          <li className={styles.bulletItem}>
            <span className={styles.bulletIcon}>•</span>
            <span>Important service updates, billing notifications, and administrative notices.</span>
          </li>
        </ul>
        <p className={styles.paragraph}>
          Where permitted, we may separately offer optional product news, educational updates, or promotional
          communications. Users may opt out of optional marketing communications through available unsubscribe
          mechanisms. Opting out of marketing does not prevent necessary transactional or security communications.
        </p>
      </>
    ),
  },
  {
    id: "changes-to-policy",
    num: 22,
    title: "Changes to This Privacy Policy",
    content: (
      <>
        <p className={styles.paragraph}>
          We may update this Privacy Policy to reflect changes in technology, legal requirements, service providers,
          business operations, or privacy practices.
        </p>
        <p className={styles.paragraph}>
          When changes are material, we will provide appropriate notice through the Services, email, or another suitable
          method. Where required by applicable law, we will request additional consent.
        </p>
        <p className={styles.paragraph}>The effective date and last-updated date will be revised when the Policy changes.</p>
      </>
    ),
  },
  {
    id: "grievance-redressal",
    num: 23,
    title: "Grievance Redressal and Privacy Contact",
    content: (
      <>
        <p className={styles.paragraph}>
          If you have a question, complaint, or request concerning personal information, you may contact our designated
          privacy or grievance contact:
        </p>
        <div className={styles.contactGrid}>
          <div className={styles.contactCard}>
            <span className={styles.contactCardLabel}>Privacy / Grievance Desk</span>
            <span className={styles.contactCardValue}>Data Protection & Grievance Officer</span>
          </div>
          <div className={styles.contactCard}>
            <span className={styles.contactCardLabel}>Official Email</span>
            <span className={styles.contactCardValue}>
              <a href="mailto:privacy@operatsi.com" className={styles.contactCardLink}>
                privacy@operatsi.com
              </a>
            </span>
          </div>
          <div className={styles.contactCard}>
            <span className={styles.contactCardLabel}>Physical Address</span>
            <span className={styles.contactCardValue}>OVIC Labs HQ, HITEC City, Hyderabad, Telangana, India</span>
          </div>
          <div className={styles.contactCard}>
            <span className={styles.contactCardLabel}>Response Timeline</span>
            <span className={styles.contactCardValue}>Within 72 business hours</span>
          </div>
        </div>
        <p className={styles.paragraph} style={{ marginTop: "16px" }}>
          Where relevant, individuals may also have the right to approach the competent data protection authority after
          following applicable grievance procedures.
        </p>
      </>
    ),
  },
  {
    id: "contact-information",
    num: 24,
    title: "Contact Information",
    content: (
      <>
        <p className={styles.paragraph}>For questions about Operatsi and our privacy framework, contact:</p>
        <div className={styles.contactGrid}>
          <div className={styles.contactCard}>
            <span className={styles.contactCardLabel}>Operating Brand</span>
            <span className={styles.contactCardValue}>Operatsi — An OVIC Labs Company</span>
          </div>
          <div className={styles.contactCard}>
            <span className={styles.contactCardLabel}>Legal Operating Entity</span>
            <span className={styles.contactCardValue}>OVIC Labs Private Limited</span>
          </div>
          <div className={styles.contactCard}>
            <span className={styles.contactCardLabel}>Registered Office</span>
            <span className={styles.contactCardValue}>HITEC City, Hyderabad, Telangana, India</span>
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
            <span className={styles.contactCardLabel}>Data Privacy Officer</span>
            <span className={styles.contactCardValue}>
              <a href="mailto:privacy@operatsi.com" className={styles.contactCardLink}>
                privacy@operatsi.com
              </a>
            </span>
          </div>
          <div className={styles.contactCard}>
            <span className={styles.contactCardLabel}>Security Operations</span>
            <span className={styles.contactCardValue}>
              <a href="mailto:security@operatsi.com" className={styles.contactCardLink}>
                security@operatsi.com
              </a>
            </span>
          </div>
        </div>
      </>
    ),
  },
];

export default function PrivacyPolicyPage() {
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
          <h1 className={styles.heroTitle}>Privacy Policy</h1>
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
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Version</span>
              <span className={styles.metaValue}>1.0 (Enterprise)</span>
            </div>
          </div>

          {/* Corporate Welcome Notice Box */}
          <div className={styles.welcomeNotice}>
            <h2 className={styles.welcomeHeading}>Welcome to Operatsi</h2>
            <p className={styles.welcomeText}>
              At Operatsi, we recognize that privacy, confidentiality, transparency, and information security are
              essential to the trust placed in our platform by founders, professionals, businesses, and enterprises.
            </p>
            <p className={styles.welcomeText}>
              This Privacy Policy explains how OVIC Labs Private Limited, operating the Operatsi platform under the OVIC
              Labs brand (&quot;Operatsi,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), collects, uses,
              stores, shares, retains, and protects personal information when you access or use our websites,
              applications, artificial intelligence services, automated agents, cloud browser environments, and related
              services.
            </p>
            <p className={styles.welcomeText}>
              <span className={styles.highlightText}>
                By using Operatsi, you acknowledge that you have been provided this Privacy Policy.
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
              <span>Official Privacy Governance</span>
              <span>•</span>
              <span>Hyderabad, Telangana, India</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
