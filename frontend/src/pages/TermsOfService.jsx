import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/LegalPages.css';

const TermsOfService = () => {
  const navigate = useNavigate();

  return (
    <div className="legal-page-container">
      <div className="legal-content">
        <button className="back-button" onClick={() => navigate(-1)}>
          ← Back
        </button>

        <h1 className="legal-title">Terms of Service</h1>
        <p className="last-updated">Last updated: March 30, 2026</p>

        <section className="legal-section">
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing and using SwachhSetu, you agree to be bound by these Terms of Service.
            If you do not agree to these terms, please do not use our platform.
          </p>
        </section>

        <section className="legal-section">
          <h2>2. Platform Description</h2>
          <p>
            SwachhSetu is a civic hygiene reporting platform that enables citizens to report
            hygiene and cleanliness issues to municipal authorities. The platform aims to improve
            public health and sanitation through community engagement.
          </p>
        </section>

        <section className="legal-section">
          <h2>3. User Responsibilities</h2>
          <h3>3.1 Account Security</h3>
          <p>You are responsible for:</p>
          <ul>
            <li>Maintaining the confidentiality of your account credentials</li>
            <li>All activities that occur under your account</li>
            <li>Notifying us immediately of any unauthorized access</li>
          </ul>

          <h3>3.2 Report Submission</h3>
          <p>When submitting reports, you must:</p>
          <ul>
            <li>Provide accurate and truthful information</li>
            <li>Submit reports only for genuine civic issues</li>
            <li>Respect the privacy of others in photos and descriptions</li>
            <li>Not submit spam, offensive, or misleading content</li>
            <li>Not misuse the platform for personal gain or harassment</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>4. Prohibited Activities</h2>
          <p>You may not:</p>
          <ul>
            <li>Submit false, fraudulent, or misleading reports</li>
            <li>Harass, threaten, or defame others</li>
            <li>Upload malicious code or viruses</li>
            <li>Attempt to gain unauthorized access to the platform</li>
            <li>Use automated systems to scrape or access the platform</li>
            <li>Impersonate others or misrepresent your affiliation</li>
            <li>Violate any applicable laws or regulations</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>5. Content Ownership</h2>
          <h3>5.1 Your Content</h3>
          <p>
            You retain ownership of the content you submit (reports, photos, comments). By submitting
            content, you grant SwachhSetu a non-exclusive, worldwide license to use, display, and
            share your content with municipal authorities for the purpose of resolving civic issues.
          </p>

          <h3>5.2 Platform Content</h3>
          <p>
            All platform features, design, and functionality are owned by SwachhSetu and protected
            by intellectual property laws.
          </p>
        </section>

        <section className="legal-section">
          <h2>6. Gamification and Rewards</h2>
          <p>
            The platform includes a gamification system with points, badges, and leaderboards.
            These are virtual rewards with no monetary value and cannot be exchanged for cash
            or physical goods. We reserve the right to modify or discontinue the gamification
            system at any time.
          </p>
        </section>

        <section className="legal-section">
          <h2>7. AI Features</h2>
          <p>
            Our platform uses AI for report triage, language analysis, and image verification.
            AI-generated content is provided for assistance only and may contain errors. Human
            review is applied for final decisions.
          </p>
        </section>

        <section className="legal-section">
          <h2>8. Disclaimers</h2>
          <p>
            <strong>No Warranty:</strong> The platform is provided "as is" without warranties
            of any kind. We do not guarantee uninterrupted access or error-free operation.
          </p>
          <p>
            <strong>No Guarantee of Resolution:</strong> While we forward reports to relevant
            authorities, we cannot guarantee that all issues will be resolved or resolved
            within a specific timeframe.
          </p>
        </section>

        <section className="legal-section">
          <h2>9. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, SwachhSetu shall not be liable for any
            indirect, incidental, special, or consequential damages arising from your use of
            the platform.
          </p>
        </section>

        <section className="legal-section">
          <h2>10. Account Termination</h2>
          <p>
            We reserve the right to suspend or terminate accounts that violate these terms.
            You may delete your account at any time from your profile settings.
          </p>
        </section>

        <section className="legal-section">
          <h2>11. Modifications to Terms</h2>
          <p>
            We may modify these terms at any time. Continued use of the platform after changes
            constitutes acceptance of the new terms. We will notify users of significant changes.
          </p>
        </section>

        <section className="legal-section">
          <h2>12. Governing Law</h2>
          <p>
            These terms are governed by the laws of India. Any disputes shall be resolved in
            the courts of India.
          </p>
        </section>

        <section className="legal-section">
          <h2>13. Contact Information</h2>
          <p>
            For questions about these terms, please contact:
          </p>
          <p className="contact-info">
            Email: legal@swachhsetu.com<br />
            Address: SwachhSetu, Civic Tech Solutions, India
          </p>
        </section>

        <section className="legal-section">
          <h2>14. Severability</h2>
          <p>
            If any provision of these terms is found to be unenforceable, the remaining
            provisions shall continue in full force and effect.
          </p>
        </section>
      </div>
    </div>
  );
};

export default TermsOfService;
