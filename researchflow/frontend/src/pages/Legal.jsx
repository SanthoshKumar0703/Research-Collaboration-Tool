import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Download, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';
import { useToast } from '../lib/toast';

const PRIVACY = {
  title: 'Privacy Policy',
  updated: 'August 2026',
  sections: [
    ['1. Introduction', 'ResearchFlow ("we", "us", "our") provides a collaborative research workspace. This Privacy Policy explains what information we collect, how we use it, and the choices you have. By creating an account or using the service, you agree to this policy. This document describes our commitments as a research platform; institutional deployments may add addenda.'],
    ['2. Information We Collect', 'We collect: (a) account information you provide — name, email, role, institution, department and research interests; (b) content you create — projects, tasks, documents, experiments, findings, messages and discussions; (c) usage data — pages viewed, actions taken, device and browser information; (d) authentication data — hashed passwords, OTP verification records and OAuth identity information from Google when you use SSO.'],
    ['3. How We Use Information', 'We use your information to: operate and secure the service; deliver your workspace and role-based features; send transactional email (login OTP, password reset, meeting reminders); compute analytics you and your supervisors can see; and improve the product. We do not sell personal data, and we do not use research content to train third-party models.'],
    ['4. Research Data', 'Research data — datasets, papers, experimental results and drafts — is treated as your intellectual property. It is accessible only to project members with the role-based permissions you grant. We may process research data to provide features you invoke (for example, on-device or on-infrastructure AI analysis), and we never share it with other tenants.'],
    ['5. Document Storage', 'Uploaded documents are stored in object storage with per-tenant access control; only metadata (name, version, uploader, size, timestamps) resides in the primary database. Files are encrypted in transit and at rest. Version history preserves prior versions so your team can restore or audit them.'],
    ['6. Data Security', 'We employ industry-standard safeguards: salted password hashing, short-lived authentication tokens, transport encryption, role-based access control enforced server-side, input validation, rate limiting and audit logging of sensitive actions. Security is a process, not a product — we review our controls regularly and respond to reports of vulnerabilities.'],
    ['7. Cookies', 'We use strictly necessary cookies/sessions to keep you signed in and security cookies to prevent abuse. Optional analytics cookies are used only with your consent. You can clear stored credentials at any time from your browser or by signing out.'],
    ['8. Third-Party Services', 'Where configured, we rely on: SMTP email providers (for transactional email), Google (for optional OAuth sign-in), Ollama-based local AI infrastructure (no external model API by default), and object storage (for files). Each is engaged under terms that require protection of your data, and we disclose specific providers in your workspace settings.'],
    ['9. User Rights', 'Depending on your jurisdiction, you may have the right to access, correct, export or delete your personal data, and to object to certain processing. You can export or delete most content directly from your workspace. For anything else, contact us at privacy@researchflow.app and we will respond within 30 days.'],
    ['10. Data Retention', 'Account data is retained while your account is active. After account deletion, personal data is removed from active systems within 30 days, except where retention is required by law or for security (for example, audit logs kept for 12 months in anonymised form). Retained research documents can be scheduled for deletion by project owners.'],
    ['11. Contact', 'Questions, requests or concerns: privacy@researchflow.app. We aim to answer within 5 business days.'],
  ],
};

const TERMS = {
  title: 'Terms & Conditions',
  updated: 'August 2026',
  sections: [
    ['1. Acceptance of Terms', 'These Terms govern access to and use of ResearchFlow. By creating an account, clicking "accept", or using the service, you agree to be bound by these Terms on behalf of yourself or your institution. If you do not agree, do not use the service.'],
    ['2. User Accounts', 'You must provide accurate information and keep it current. You are responsible for activity under your account and for choosing secure credentials. Accounts are personal; supervisor and admin accounts may manage projects within the scopes granted to them. Public registration is available to researchers and supervisors; admin accounts are provisioned by the platform operator.'],
    ['3. Research Projects', 'Project owners define who may view and edit their projects. You agree to use projects for legitimate research activity. Collaborators may access only the projects they have been added to, with the permissions of their role.'],
    ['4. Uploaded Content', 'You retain ownership of content you upload. By uploading, you grant ResearchFlow a limited license to store, display, process and transmit that content solely to operate the service for you and your project team. You represent that you have the rights necessary to upload each file.'],
    ['5. Intellectual Property', 'ResearchFlow owns the platform, its design, code and marks. AI-assisted output is generated from your project context; the underlying findings and writing remain your intellectual property, subject to your institution’s policies.'],
    ['6. Acceptable Use', 'You may not: use the service to store illegal content; attempt to access other tenants’ data; probe, scan or load-test the system without permission; upload malware; use the service for spam; or circumvent role-based restrictions. We may suspend access that we reasonably believe violates these Terms.'],
    ['7. User Responsibilities', 'You are responsible for: the accuracy of data you enter (including experimental results, which should follow your institution’s integrity standards); protecting your credentials; configuring permissions appropriately; and reviewing work before publication — the platform surfaces data, it does not certify science.'],
    ['8. Platform Availability', 'The service is provided "as is" and "as available". We target high availability and will post notices of planned maintenance, but do not guarantee uninterrupted access. We are not liable for data loss except where caused by our gross negligence.'],
    ['9. Account Termination', 'You may delete your account at any time; content in projects you own will be handled as described in the Privacy Policy. We may suspend or terminate accounts that breach these Terms, with notice where practicable and an opportunity to respond for non-urgent matters.'],
    ['10. Liability', 'To the maximum extent permitted by law, ResearchFlow’s aggregate liability arising out of the service is limited to the fees paid in the 12 months before the claim, and we exclude indirect or consequential damages. Nothing in these Terms limits liability that cannot be limited by law.'],
    ['11. Contact', 'Questions about these Terms: legal@researchflow.app. We may update these Terms with 30 days’ notice for material changes; continued use after the effective date constitutes acceptance.'],
  ],
};

function makePdf(doc) {
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = pdf.internal.pageSize.getWidth();
  const M = 64;
  const maxW = W - M * 2;
  let y = 72;

  const ensure = (h) => {
    if (y + h > pdf.internal.pageSize.getHeight() - 64) {
      pdf.addPage();
      y = 72;
    }
  };

  pdf.setFont('times', 'bold');
  pdf.setFontSize(22);
  pdf.text('ResearchFlow', M, y);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(110);
  pdf.text(doc.title, M, y + 18);
  pdf.setFontSize(9);
  pdf.text(`Last updated: ${doc.updated}`, M, y + 32);
  y += 52;
  pdf.setDrawColor(150);
  pdf.line(M, y, W - M, y);
  y += 24;
  pdf.setTextColor(0);

  doc.sections.forEach(([head, body]) => {
    pdf.setFont('times', 'bold');
    pdf.setFontSize(13);
    ensure(30);
    pdf.text(head, M, y);
    y += 18;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10.5);
    const lines = pdf.splitTextToSize(body, maxW);
    lines.forEach((ln) => {
      ensure(16);
      pdf.text(ln, M, y);
      y += 15;
    });
    y += 12;
  });

  const pages = pdf.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8.5);
    pdf.setTextColor(130);
    pdf.text(`© 2026 ResearchFlow — ${doc.title}`, M, pdf.internal.pageSize.getHeight() - 40);
    pdf.text(`${i} / ${pages}`, W - M - 24, pdf.internal.pageSize.getHeight() - 40);
  }
  pdf.save(`${doc.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`);
}

export function LegalLayout({ doc, kind }) {
  const toast = useToast();
  const [busy, setBusy] = React.useState(false);
  const download = () => {
    setBusy(true);
    setTimeout(() => {
      try {
        makePdf(doc);
        toast(`${doc.title} downloaded as PDF`);
      } catch (e) {
        toast('Could not generate the PDF.', 'err');
      } finally {
        setBusy(false);
      }
    }, 350);
  };

  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-5">
          <Link to="/" className="flex items-center gap-1.5 text-[13.5px] font-medium text-ink-2 transition hover:text-wine">
            <ArrowLeft size={15} /> Back to Landing Page
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button onClick={download} className="btn-outline px-4 py-2 text-[13px]" disabled={busy}>
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              Download
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-14 lg:py-20">
        <div className="mb-12 border-b border-line pb-10">
          <div className="flex items-center gap-3">
            <Logo size={26} />
            <span className="text-[11px] font-semibold tracking-[0.2em] text-copper uppercase">Legal document</span>
          </div>
          <h1 className="mt-6 font-display text-4xl font-semibold tracking-tight text-ink lg:text-5xl">{doc.title}</h1>
          <p className="mt-3 text-sm text-faint">Last updated: {doc.updated} · Applies to all ResearchFlow workspaces</p>
        </div>

        <div className="space-y-9">
          {doc.sections.map(([head, body], i) => (
            <section key={head}>
              <h2 className="font-display text-xl font-semibold text-ink">{head}</h2>
              <p className="mt-3 text-[14.5px] leading-[1.85] text-ink-2">{body}</p>
            </section>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center gap-3 rounded-2xl border border-line bg-paper-soft/50 px-6 py-8 text-center">
          <p className="text-sm text-faint">Questions about this document?</p>
          <a
            href={kind === 'privacy' ? 'mailto:privacy@researchflow.app' : 'mailto:legal@researchflow.app'}
            className="text-[14px] font-medium text-wine hover:underline"
          >
            {kind === 'privacy' ? 'privacy@researchflow.app' : 'legal@researchflow.app'}
          </a>
        </div>
      </main>
    </div>
  );
}

export const PrivacyPolicy = () => <LegalLayout doc={PRIVACY} kind="privacy" />;
export const Terms = () => <LegalLayout doc={TERMS} kind="terms" />;
