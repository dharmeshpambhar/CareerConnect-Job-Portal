import React from "react";
import { Link } from "react-router-dom";
import {
  HiOutlineLightningBolt,
  HiOutlineShieldCheck,
  HiOutlineUserGroup,
  HiOutlineGlobeAlt,
  HiOutlineBriefcase,
  HiOutlineSparkles,
  HiOutlineMail,
  HiOutlineLocationMarker,
} from "react-icons/hi";
import { FiArrowRight, FiLinkedin, FiTwitter, FiGithub } from "react-icons/fi";

const STATS = [
  { value: "50K+", label: "Active Jobseekers" },
  { value: "8K+",  label: "Companies Hiring" },
  { value: "120K+",label: "Jobs Posted" },
  { value: "92%",  label: "Placement Rate" },
];

const VALUES = [
  {
    icon: <HiOutlineLightningBolt />,
    title: "Speed & Efficiency",
    desc: "We cut through the noise so the right candidates reach the right employers — fast.",
    color: "#f59e0b",
  },
  {
    icon: <HiOutlineShieldCheck />,
    title: "Trust & Transparency",
    desc: "Every listing is verified. Every application is traceable. No hidden processes.",
    color: "#10b981",
  },
  {
    icon: <HiOutlineUserGroup />,
    title: "Community First",
    desc: "We're building more than a job board — a network where careers are made.",
    color: "#6366f1",
  },
  {
    icon: <HiOutlineGlobeAlt />,
    title: "Inclusive Reach",
    desc: "Opportunities for everyone, regardless of background, location or experience level.",
    color: "#ec4899",
  },
];

const TEAM = [
  {
    name: "Dharmesh Pambhar",
    title: "Founder & CEO",
    avatar: "DP",
    color: ["#1e40af", "#3b82f6"],
    bio: "10+ years building HR-tech platforms across India and Southeast Asia.",
  },
  {
    name: "Deep Chauhan",
    title: "Head of Product",
    avatar: "DC",
    color: ["#065f46", "#10b981"],
    bio: "Formerly at LinkedIn India. Passionate about frictionless UX and smart matching.",
  },
  {
    name: "Mayur Mori",
    title: "Lead Engineer",
    avatar: "MM",
    color: ["#4c1d95", "#8b5cf6"],
    bio: "Full-stack architect who believes great tech should be invisible to the user.",
  },
];

const AboutUs = () => {
  return (
    <section className="about-page">

      {/* ── Hero ── */}
      <div className="about-hero">
        <div className="about-hero-inner">
          <span className="about-hero-badge">
            <HiOutlineSparkles /> Our Story
          </span>
          <h1 className="about-hero-title">
            Connecting <span className="about-hero-highlight">Talent</span> with<br />
            Opportunity, Seamlessly.
          </h1>
          <p className="about-hero-subtitle">
            CareerConnect was built with a single purpose — to make the journey from
            job search to offer letter as smooth, transparent, and human as possible.
          </p>
          <div className="about-hero-actions">
            <Link to="/job/getall" className="about-cta-primary">
              Browse Jobs <FiArrowRight />
            </Link>
            <Link to="/register" className="about-cta-secondary">
              Join Free
            </Link>
          </div>
        </div>
        <div className="about-hero-orbs">
          <div className="about-orb about-orb-1" />
          <div className="about-orb about-orb-2" />
          <div className="about-orb about-orb-3" />
        </div>
      </div>

      {/* ── Stats Bar ── */}
      <div className="about-stats-bar">
        {STATS.map((s, i) => (
          <div className="about-stat-item" key={i}>
            <span className="about-stat-value">{s.value}</span>
            <span className="about-stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── Mission & Vision ── */}
      <div className="about-section about-mv-grid">
        <div className="about-mv-card about-mission-card">
          <div className="about-mv-icon">
            <HiOutlineBriefcase />
          </div>
          <h2>Our Mission</h2>
          <p>
            To democratize access to employment opportunities by connecting
            skilled professionals with forward-thinking companies through a
            platform that is fast, fair, and deeply human-centered.
          </p>
        </div>
        <div className="about-mv-card about-vision-card">
          <div className="about-mv-icon about-mv-icon--vision">
            <HiOutlineGlobeAlt />
          </div>
          <h2>Our Vision</h2>
          <p>
            A world where geography, background, or circumstance never limits
            someone's career potential — where every job seeker finds their
            best match and every company builds its dream team.
          </p>
        </div>
      </div>

      {/* ── Core Values ── */}
      <div className="about-section">
        <div className="about-section-header">
          <span className="about-section-badge">What We Stand For</span>
          <h2 className="about-section-title">Our Core Values</h2>
          <p className="about-section-sub">
            Every feature we build, every partnership we form is rooted in these principles.
          </p>
        </div>
        <div className="about-values-grid">
          {VALUES.map((v, i) => (
            <div className="about-value-card" key={i} style={{ "--val-color": v.color }}>
              <div className="about-value-icon" style={{ color: v.color, background: `${v.color}18` }}>
                {v.icon}
              </div>
              <h3>{v.title}</h3>
              <p>{v.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Team ── */}
      <div className="about-section about-team-section">
        <div className="about-section-header">
          <span className="about-section-badge">The People Behind It</span>
          <h2 className="about-section-title">Meet Our Team</h2>
          <p className="about-section-sub">
            Experienced professionals from the HR-tech space who share one goal: your success.
          </p>
        </div>
        <div className="about-team-grid">
          {TEAM.map((member, i) => (
            <div className="about-team-card" key={i}>
              <div
                className="about-team-avatar"
                style={{ background: `linear-gradient(135deg, ${member.color[0]}, ${member.color[1]})` }}
              >
                {member.avatar}
              </div>
              <div className="about-team-info">
                <h3>{member.name}</h3>
                <span className="about-team-title">{member.title}</span>
                <p>{member.bio}</p>
              </div>
              <div className="about-team-socials">
                <a href="#" className="about-social-btn" title="LinkedIn"><FiLinkedin /></a>
                <a href="#" className="about-social-btn" title="Twitter"><FiTwitter /></a>
                <a href="#" className="about-social-btn" title="GitHub"><FiGithub /></a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Contact CTA ── */}
      <div className="about-contact-banner">
        <div className="about-contact-left">
          <h2>Want to partner with us or have questions?</h2>
          <div className="about-contact-meta">
            <span><HiOutlineMail /> hello@careerconnect.in</span>
            <span><HiOutlineLocationMarker /> Ahmedabad, Gujarat, India</span>
          </div>
        </div>
        <Link to="/register" className="about-cta-primary about-contact-btn">
          Get Started <FiArrowRight />
        </Link>
      </div>

    </section>
  );
};

export default AboutUs;
