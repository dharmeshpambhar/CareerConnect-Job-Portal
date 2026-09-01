import React from "react";
import { FaUserPlus } from "react-icons/fa";
import { MdFindInPage } from "react-icons/md";
import { IoMdSend } from "react-icons/io";
import { FiArrowRight } from "react-icons/fi";

const steps = [
  {
    id: 1,
    num: "01",
    icon: <FaUserPlus />,
    title: "Create Your Account",
    desc: "Sign up in seconds — for free. Build your profile, upload your resume, and let top employers discover your talent.",
    tag: "Get Started",
    color: "hiw-step-indigo",
  },
  {
    id: 2,
    num: "02",
    icon: <MdFindInPage />,
    title: "Find or Post a Job",
    desc: "Browse thousands of verified listings with salary insights or post openings to match the right candidates instantly.",
    tag: "Smart Matching",
    color: "hiw-step-sky",
  },
  {
    id: 3,
    num: "03",
    icon: <IoMdSend />,
    title: "Apply & Get Hired",
    desc: "One-click apply to your dream roles, track your application progress in real time, and land your next opportunity.",
    tag: "Fast Track",
    color: "hiw-step-emerald",
  },
];

const HowItWorks = () => {
  return (
    <div className="howitworks">
      <div className="container">
        <div className="section-header">
          <span className="section-eyebrow">Simple & Fast</span>
          <h3>How CareerConnect Works</h3>
          <p className="section-sub">
            Your seamless path from discovery to dream job in three straightforward steps.
          </p>
        </div>

        <div className="hiw-grid">
          {steps.map((step, idx) => (
            <React.Fragment key={step.id}>
              <div className={`hiw-card ${step.color}`}>
                <div className="hiw-card-header">
                  <div className="hiw-icon-wrap">
                    {step.icon}
                  </div>
                  <span className="hiw-step-pill">STEP {step.num}</span>
                </div>

                <div className="hiw-card-body">
                  <h4 className="hiw-title">{step.title}</h4>
                  <p className="hiw-desc">{step.desc}</p>
                </div>

                <div className="hiw-card-footer">
                  <span className="hiw-feature-tag">{step.tag}</span>
                </div>
              </div>

              {idx < steps.length - 1 && (
                <div className="hiw-arrow-divider">
                  <FiArrowRight />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;
