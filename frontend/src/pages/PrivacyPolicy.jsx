import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/LegalPages.css';

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="legal-page-container">
      <div className="legal-content">
        <button className="back-button" onClick={() => navigate(-1)}>
          ← Back
        </button>

        <h1 className="legal-title">Privacy Policy</h1>
        <p className="last-updated">Last updated: March 30, 2026</p>

        <section className="legal-section">
          <h2>1. Introduction</h2>
          <p>
            Welcome to SwachhSetu. We respect your privacy and are committed to protecting your personal data.
            This privacy policy explains how we collect, use, and safeguard your information when you use our
            civic hygiene reporting platform.
          </p>
        </section>

        <section className="legal-section">
          <h2>2. Information We Collect</h2>
          <h3>2.1 Personal Information</h3>
          <p>When you register for an account, we collect:</p>
          <ul>
            <li>Name and email address</li>
            <li>Phone number (optional)</li>
            <li>Profile picture (optional)</li>
          </ul>

          <h3>2.2 Report Data</h3>
          <p>When you submit reports, we collect:</p>
          <ul>
            <li>Issue descriptions and categories</li>
            <li>Location data (GPS coordinates)</li>
            <li>Photos of the reported issues</li>
            <li>Timestamps of submissions</li>
          </ul>

          <h3>2.3 Usage Data</h3>
          <p>We automatically collect:</p>
          <ul>
            <li>Device information and IP address</li>
            <li>Browser type and version</li>
            <li>Pages visited and time spent on the platform</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>3. How We Use Your Information</h2>
          <p>We use your information to:</p>
          <ul>
            <li>Process and manage civic issue reports</li>
            <li>Improve municipal services and response times</li>
            <li>Send notifications about report status updates</li>
            <li>Maintain and improve our platform</li>
            <li>Prevent fraud and ensure security</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>4. Data Sharing</h2>
          <p>
            We share your report data with relevant municipal authorities to facilitate issue resolution.
            We do not sell your personal information to third parties. Your data may be shared with:
          </p>
          <ul>
            <li>Municipal corporations and civic authorities</li>
            <li>Government agencies for public welfare</li>
            <li>Service providers who assist in platform operations</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>5. Data Security</h2>
          <p>
            We implement industry-standard security measures to protect your data, including:
          </p>
          <ul>
            <li>Encrypted data transmission (HTTPS)</li>
            <li>Secure authentication with JWT tokens</li>
            <li>Regular security audits</li>
            <li>Access controls and monitoring</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>6. Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access your personal data</li>
            <li>Correct inaccurate information</li>
            <li>Request deletion of your account</li>
            <li>Opt-out of non-essential communications</li>
            <li>Export your data</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>7. Cookies</h2>
          <p>
            We use essential cookies for authentication and platform functionality. We do not use
            third-party advertising cookies.
          </p>
        </section>

        <section className="legal-section">
          <h2>8. Children's Privacy</h2>
          <p>
            Our platform is not intended for users under 13 years of age. We do not knowingly
            collect data from children.
          </p>
        </section>

        <section className="legal-section">
          <h2>9. Changes to This Policy</h2>
          <p>
            We may update this privacy policy periodically. We will notify you of significant
            changes via email or platform notifications.
          </p>
        </section>

        <section className="legal-section">
          <h2>10. Contact Us</h2>
          <p>
            If you have questions about this privacy policy or your data, please contact us at:
          </p>
          <p className="contact-info">
            Email: privacy@swachhsetu.com<br />
            Address: SwachhSetu, Civic Tech Solutions, India
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
