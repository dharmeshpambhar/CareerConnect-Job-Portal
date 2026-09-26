import React, { useContext, useEffect, useState } from "react";
import { Link, useParams, Navigate, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Context } from "../../main";
import { FaBookmark, FaRegBookmark } from "react-icons/fa";
import { FiArrowLeft, FiChevronDown, FiChevronUp, FiExternalLink, FiHelpCircle, FiFileText, FiBriefcase, FiUser } from "react-icons/fi";
import { fetchJobById, toggleWishlist, fetchWishlist } from "../../apiService";

const JobDetails = () => {
  const { id } = useParams();
  const [job, setJob] = useState({});
  const [fetchingJob, setFetchingJob] = useState(true);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const navigateTo = useNavigate();

  const { isAuthorized, user, isLoading } = useContext(Context);
  const [savedJobIds, setSavedJobIds] = useState(new Set());

  useEffect(() => {
    if (isAuthorized) {
      setFetchingJob(true);
      fetchJobById(id)
        .then(({ job: data, offline }) => {
          if (data) {
            setJob(data);
          } else if (!offline) {
            navigateTo("/notfound");
          }
        })
        .finally(() => {
          setFetchingJob(false);
        });
    }
  }, [isAuthorized, id]);

  // Load saved job IDs from the wishlist collection
  useEffect(() => {
    if (isAuthorized && user?.role === "Job Seeker") {
      fetchWishlist().then(({ wishlist }) => {
        const ids = new Set((wishlist || []).map((item) => item.job?._id?.toString()));
        setSavedJobIds(ids);
      });
    } else {
      setSavedJobIds(new Set());
    }
  }, [isAuthorized, user]);

  const handleWishlistToggle = async (jobId) => {
    if (!jobId) return;
    if (!isAuthorized) {
      toast.error("Please login to bookmark jobs!");
      return;
    }
    try {
      const result = await toggleWishlist(jobId);
      toast.success(result.message);
      setSavedJobIds((prev) => {
        const next = new Set(prev);
        if (result.saved) {
          next.add(jobId.toString());
        } else {
          next.delete(jobId.toString());
        }
        return next;
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  };

  const isWishlisted = (jobId) => {
    if (!jobId) return false;
    return savedJobIds.has(jobId.toString());
  };

  if (isLoading || fetchingJob) {
    return <div className="loading" style={{ textAlign: "center", margin: "100px auto", fontSize: "1.5rem" }}>Loading...</div>;
  }

  if (!isAuthorized) {
    return <Navigate to="/login" />;
  }

  if (!job || !job._id) {
    return <div style={{ textAlign: "center", margin: "100px auto", fontSize: "1.5rem" }}>Job not found or unavailable.</div>;
  }

  // Dynamic derivations based on fields to enrich UI visually
  const deriveExperience = (jobId) => {
    if (!jobId) return "Entry Level";
    const charCodeSum = jobId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const mod = charCodeSum % 3;
    if (mod === 0) return "Entry Level";
    if (mod === 1) return "2+ Years";
    return "5+ Years";
  };

  const deriveJobType = (jobId) => {
    if (!jobId) return "Remote";
    const charCodeSum = jobId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const mod = charCodeSum % 3;
    if (mod === 0) return "Remote";
    if (mod === 1) return "Hybrid";
    return "Onsite";
  };

  const deriveSkills = (category = "", title = "") => {
    const cat = (category || "").toLowerCase();
    const t = (title || "").toLowerCase();

    if (t.includes("front") || cat.includes("front")) {
      return ["React", "JavaScript", "HTML5", "CSS3", "Redux"];
    }
    if (t.includes("back") || cat.includes("back")) {
      return ["Node.js", "Python", "SQL", "Express", "REST APIs"];
    }
    if (t.includes("mern") || cat.includes("mern") || t.includes("full stack") || cat.includes("full stack")) {
      return ["React", "Node.js", "Express", "MongoDB", "JavaScript"];
    }
    if (t.includes("architect") || cat.includes("architect")) {
      return ["Software Architecture", "System Design", "Microservices", "Cloud Infrastructure"];
    }
    if (t.includes("ai") || t.includes("ml") || cat.includes("ai") || cat.includes("machine") || cat.includes("artificial")) {
      return ["Python", "Machine Learning", "Deep Learning", "TensorFlow"];
    }
    if (cat.includes("design") || cat.includes("graphic") || cat.includes("ui") || cat.includes("ux") || t.includes("design") || t.includes("ui")) {
      return ["Figma", "UI/UX", "Adobe Suite", "Interaction", "Prototyping"];
    }
    if (cat.includes("market") || cat.includes("seo") || cat.includes("ad") || t.includes("seo") || t.includes("market")) {
      return ["Google Analytics", "SEO", "Copywriting", "Social Media", "Campaigns"];
    }
    if (t.includes("mobile") || cat.includes("mobile") || t.includes("flutter") || t.includes("react native") || t.includes("android") || t.includes("ios")) {
      return ["React Native", "Flutter", "iOS", "Android"];
    }
    if (t.includes("data") || cat.includes("data")) {
      return ["SQL", "Python", "Data Analysis", "Power BI", "Tableau"];
    }
    if (cat.includes("web") || cat.includes("developer")) {
      return ["React", "Node.js", "Express", "MongoDB", "JavaScript"];
    }
    return ["Collaboration", "Problem Solving", "Agile", "Communication"];
  };

  const getCompanyColor = (companyName) => {
    if (!companyName) return "#6366f1";
    const colors = ["#6366f1", "#ec4899", "#14b8a6", "#f59e0b", "#3b82f6", "#10b981", "#8b5cf6"];
    const charSum = companyName.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[charSum % colors.length];
  };

  const formatSalary = (element) => {
    if (element.fixedSalary) {
      return `₹${element.fixedSalary.toLocaleString("en-IN")}`;
    }
    if (element.salaryFrom && element.salaryTo) {
      return `₹${element.salaryFrom.toLocaleString("en-IN")} - ₹${element.salaryTo.toLocaleString("en-IN")}`;
    }
    return "Negotiable";
  };

  const getCompanyName = (item) => {
    if (item?.postedBy?.companyName && item.postedBy.companyName.trim() !== "") {
      return item.postedBy.companyName.trim();
    }
    if (item?.postedBy?.company?.name && item.postedBy.company.name.trim() !== "") {
      return item.postedBy.company.name.trim();
    }
    if (item?.postedBy?.name && item.postedBy.name.trim() !== "") {
      return item.postedBy.name.trim();
    }
    return "Verified Employer";
  };

  const getEmployerId = (item) => {
    if (!item?.postedBy) return null;
    return typeof item.postedBy === "object" ? item.postedBy._id : item.postedBy;
  };

  const experience = job.experience || deriveExperience(job._id);
  const jobType = job.jobType || deriveJobType(job._id);
  const skills = (job.skills && Array.isArray(job.skills) && job.skills.length > 0)
    ? job.skills
    : (typeof job.skills === "string" && job.skills.trim())
    ? job.skills.split(",").map((s) => s.trim()).filter(Boolean)
    : deriveSkills(job.category, job.title);
  const companyTitleName = getCompanyName(job);
  const comColor = getCompanyColor(job.category || "Job");
  const initial = (companyTitleName || job.category || "J").trim().charAt(0).toUpperCase();

  // Helper to format job description into clean subheadings, bullet lists, and paragraphs
  const renderJobDescription = (rawText) => {
    if (!rawText || !rawText.trim()) {
      return <p className="job-desc-p empty">No description available for this position.</p>;
    }

    // Strip out any bracketed metadata like [Experience: ... | Skills: ...] since they are rendered in the right-side section
    const text = rawText
      .replace(/\[\s*Experience:[^\]]*\]/gi, "")
      .replace(/\[\s*Skills:[^\]]*\]/gi, "")
      .replace(/\[\s*Experience:[^\]]*\|\s*Skills:[^\]]*\]/gi, "")
      .replace(/^Experience:\s*.*$/gim, "")
      .replace(/^Skills:\s*.*$/gim, "")
      .trim();

    if (!text) {
      return <p className="job-desc-p empty">No description available for this position.</p>;
    }

    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

    // If there is just 1 single long paragraph, split into readable paragraph chunks
    if (lines.length === 1 && lines[0].length > 140) {
      const sentences = lines[0].match(/[^.!?]+[.!?]+/g) || [lines[0]];
      const chunks = [];
      let cur = "";
      sentences.forEach((s) => {
        if ((cur + s).length > 220) {
          chunks.push(cur.trim());
          cur = s;
        } else {
          cur += " " + s;
        }
      });
      if (cur.trim()) chunks.push(cur.trim());

      return chunks.map((chunk, idx) => (
        <p key={idx} className="job-desc-p">
          {chunk}
        </p>
      ));
    }

    const rendered = [];
    let currentList = [];

    const flushList = (key) => {
      if (currentList.length > 0) {
        rendered.push(
          <ul key={`ul-${key}`} className="job-desc-bullet-list">
            {currentList.map((item, i) => (
              <li key={i} className="job-desc-bullet-item">
                <span className="job-desc-bullet-dot">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        );
        currentList = [];
      }
    };

    lines.forEach((line, idx) => {
      const isBullet =
        line.startsWith("•") ||
        line.startsWith("-") ||
        line.startsWith("*") ||
        /^\d+\.\s/.test(line);

      if (isBullet) {
        const itemText = line.replace(/^[•\-*\d.]+\s*/, "");
        currentList.push(itemText);
      } else {
        flushList(idx);

        const isHeading =
          line.endsWith(":") ||
          line.startsWith("#") ||
          /^(about the role|role overview|responsibilities|key responsibilities|requirements|role requirements|qualifications|what you will do|what we offer|benefits & perks|key deliverables|overview|skills required)/i.test(line);

        if (isHeading) {
          const cleanHeading = line.replace(/^#+\s*/, "").replace(/:$/, "");
          rendered.push(
            <h4 key={`h4-${idx}`} className="job-desc-subheading">
              {cleanHeading}
            </h4>
          );
        } else {
          rendered.push(
            <p key={`p-${idx}`} className="job-desc-p">
              {line}
            </p>
          );
        }
      }
    });

    flushList("end");
    return rendered;
  };

  return (
    <section className="job-details-page-v2">
      <div className="job-details-v2-container">
        {/* Back Link */}
        <Link to="/job/getall" className="back-to-catalog-link">
          <FiArrowLeft /> Back to Catalog
        </Link>

        <div className="job-details-v2-grid">
          {/* Left Column: Job Details */}
          <div className="job-details-v2-left">
            {/* Header Card */}
            <div className="job-details-card">
              <div className="job-details-header">
                {getEmployerId(job) ? (
                  <Link to={`/company/view/${getEmployerId(job)}`} style={{ textDecoration: "none" }} title="Click to view company profile">
                    <div className="job-details-header-logo" style={{ backgroundColor: comColor, cursor: "pointer", overflow: "hidden" }}>
                      {job.postedBy?.profilePicture?.url ? (
                        <img
                          src={job.postedBy?.profilePicture?.url}
                          alt={companyTitleName}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        initial
                      )}
                    </div>
                  </Link>
                ) : (
                  <div className="job-details-header-logo" style={{ backgroundColor: comColor, overflow: "hidden" }}>
                    {job.postedBy?.profilePicture?.url ? (
                      <img
                        src={job.postedBy?.profilePicture?.url}
                        alt={companyTitleName}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      initial
                    )}
                  </div>
                )}
                <div className="job-details-header-info">
                  <h2>{job.title}</h2>
                  <p style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    {getEmployerId(job) ? (
                      <Link to={`/company/view/${getEmployerId(job)}`} className="job-details-company-link" title="Click to view company details">
                        {companyTitleName} ↗
                      </Link>
                    ) : (
                      <span>{companyTitleName}</span>
                    )}
                    {job.postedBy?.isVerified && (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          background: "#ecfdf5",
                          color: "#059669",
                          border: "1px solid #a7f3d0",
                          borderRadius: "20px",
                          padding: "2px 8px",
                          fontSize: "0.74rem",
                          fontWeight: 700,
                        }}
                        title="Official Verified Company (Certificate Verified by Admin)"
                      >
                        ✓ Verified Employer
                      </span>
                    )}
                    <span>{`• ${job.city}, ${job.country}`}</span>
                  </p>
                </div>
                {user && user.role === "Job Seeker" && (
                  <button
                    className="job-details-bookmark-btn"
                    onClick={() => handleWishlistToggle(job._id)}
                    style={{ color: isWishlisted(job._id) ? "#ef4444" : "#94a3b8" }}
                  >
                    {isWishlisted(job._id) ? (
                      <FaBookmark style={{ fontSize: "1.2rem" }} />
                    ) : (
                      <FaRegBookmark style={{ fontSize: "1.2rem" }} />
                    )}
                  </button>
                )}
              </div>

              {/* Meta Blocks Row */}
              <div className="job-details-meta-grid">
                <div className="job-details-meta-block">
                  <div className="job-details-meta-block-label">Salary</div>
                  <div className="job-details-meta-block-val" style={{ color: "#6366f1" }}>
                    {formatSalary(job)}
                  </div>
                </div>
                <div className="job-details-meta-block">
                  <div className="job-details-meta-block-label">Job Type</div>
                  <div className="job-details-meta-block-val">{jobType}</div>
                </div>
                <div className="job-details-meta-block">
                  <div className="job-details-meta-block-label">Experience</div>
                  <div className="job-details-meta-block-val">{experience}</div>
                </div>
                <div className="job-details-meta-block">
                  <div className="job-details-meta-block-label">Date Posted</div>
                  <div className="job-details-meta-block-val">
                    {job.jobPostedOn ? new Date(job.jobPostedOn).toLocaleDateString() : "N/A"}
                  </div>
                </div>
              </div>
            </div>

            {/* 3-Column Structured Job Description & Meta Card (matching design) */}
            <div className="job-details-card job-desc-layout-card">
              {/* Left Column: Circular Document Icon */}
              <div className="job-desc-left-icon-col">
                <div className="job-desc-circle-icon">
                  <FiFileText />
                </div>
              </div>

              {/* Vertical Divider */}
              <div className="job-desc-v-divider" />

              {/* Middle Column: Job Description */}
              <div className="job-desc-middle-col">
                <div className="job-desc-header-block">
                  <h3 className="job-desc-main-title">Job Description</h3>
                  <div className="job-desc-title-underline" />
                </div>
                <div className="job-desc-text-content">
                  {renderJobDescription(job.description)}
                </div>
              </div>

              {/* Vertical Divider */}
              <div className="job-desc-v-divider" />

              {/* Right Column: Experience & Skills Stack */}
              <div className="job-desc-right-meta-col">
                {/* Experience Row */}
                <div className="job-meta-pill-row">
                  <div className="job-meta-icon-sq">
                    <FiBriefcase />
                  </div>
                  <div className="job-meta-text-box">
                    <span className="job-meta-label">Experience</span>
                    <span className="job-meta-val">{experience}</span>
                  </div>
                </div>

                {/* Skills Row */}
                <div className="job-meta-pill-row">
                  <div className="job-meta-icon-sq">
                    <FiUser />
                  </div>
                  <div className="job-meta-text-box">
                    <span className="job-meta-label">Skills</span>
                    <span className="job-meta-val">{skills.join(", ")}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Actions Sidebar */}
          <div className="job-details-v2-right">

            {/* Ready to Apply Card */}
            <div className="job-details-side-card">
              <h3>Ready to Apply?</h3>
              <p>Ensure your profile bio and skill tags are up-to-date before applying to maximize AI fit scores.</p>
              {user && user.role === "Employer" ? (
                <button className="job-details-side-btn" disabled style={{ background: "#cbd5e1", cursor: "not-allowed" }}>
                  Employers Cannot Apply
                </button>
              ) : (
                <Link to={`/application/${job._id}`} className="job-details-side-btn">
                  Apply for Position
                </Link>
              )}
            </div>

            {/* Company's FAQs Card */}
            <div className="job-company-faqs-card">
              <div className="job-faqs-header">
                <h3>
                  <span className="faq-icon-spark">❓</span> Company's FAQs
                </h3>
                {((job.postedBy?.faqs || job.postedBy?.company?.faqs || []).length > 0) && (
                  <span className="job-faqs-count-badge">
                    {(job.postedBy?.faqs || job.postedBy?.company?.faqs || []).length}
                  </span>
                )}
              </div>

              {(job.postedBy?.faqs || job.postedBy?.company?.faqs || []).length > 0 ? (
                <div className="job-faqs-list">
                  {(job.postedBy?.faqs || job.postedBy?.company?.faqs || []).map((faq, idx) => (
                    <div key={idx} className={`job-faq-item ${openFaqIndex === idx ? "open" : ""}`}>
                      <button
                        type="button"
                        className="job-faq-question-btn"
                        onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                      >
                        <span className="job-faq-q-text">{faq.question}</span>
                        {openFaqIndex === idx ? (
                          <FiChevronUp className="job-faq-chevron" />
                        ) : (
                          <FiChevronDown className="job-faq-chevron" />
                        )}
                      </button>
                      {openFaqIndex === idx && (
                        <div className="job-faq-answer-box">
                          <p>{faq.answer}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="job-faqs-empty">
                  <p>Have questions regarding this role or work culture?</p>
                </div>
              )}

              {getEmployerId(job) ? (
                <Link to={`/company/view/${getEmployerId(job)}`} className="job-faqs-profile-link">
                  View Company Profile <FiExternalLink style={{ fontSize: "0.85rem" }} />
                </Link>
              ) : (
                <Link to="/job/getall" className="job-faqs-profile-link">
                  Browse More Jobs <FiExternalLink style={{ fontSize: "0.85rem" }} />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default JobDetails;
