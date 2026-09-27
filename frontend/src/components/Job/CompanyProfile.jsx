import React, { useContext, useEffect, useState, useRef } from "react";
import { Link, Navigate } from "react-router-dom";
import { Context } from "../../main";
import toast from "react-hot-toast";
import {
  HiOutlinePencil,
  HiOutlineCheckCircle,
  HiOutlineLocationMarker,
  HiOutlinePhone,
  HiOutlineMail,
  HiOutlineBriefcase,
  HiOutlineOfficeBuilding,
  HiOutlineGlobeAlt,
  HiOutlineUsers,
  HiOutlineCalendar,
  HiOutlineSparkles,
  HiX,
  HiOutlineTrash,
  HiOutlineClipboardList,
  HiOutlineDocumentText,
  HiOutlineShieldCheck,
  HiOutlineDownload,
  HiOutlineExternalLink,
} from "react-icons/hi";
import { FaCamera, FaTrash } from "react-icons/fa";
import {
  fetchCompanyProfile,
  updateCompanyProfile,
  fetchEmployerFullProfile,
  updateEmployerFullProfileApi,
  uploadProfilePictureApi,
  deleteProfilePictureApi,
  uploadCompanyCertificateApi,
} from "../../apiService";

const COMPANY_SIZES = [
  "1–10 employees",
  "11–50 employees",
  "51–200 employees",
  "201–500 employees",
  "501–1000 employees",
  "1000+ employees",
];

const INDUSTRIES = [
  "Information Technology & Software",
  "Finance & Banking",
  "Healthcare & Life Sciences",
  "Education & E-Learning",
  "E-Commerce & Retail",
  "Manufacturing & Engineering",
  "Consulting & Business Services",
  "Media & Entertainment",
  "Logistics & Supply Chain",
  "Other",
];

const CompanyProfile = () => {
  const { isAuthorized, user, setUser, isLoading } = useContext(Context);
  const fileInputRef = useRef(null);
  const certFileInputRef = useRef(null);
  const [uploadingPic, setUploadingPic] = useState(false);
  const [uploadingCert, setUploadingCert] = useState(false);

  // Profile data states
  const [companyName, setCompanyName] = useState("");
  const [tagline, setTagline] = useState("Empowering Careers & Driving Digital Innovation");
  const [industry, setIndustry] = useState("Information Technology & Software");
  const [companySize, setCompanySize] = useState("51–200 employees");
  const [founded, setFounded] = useState("2018");
  const [website, setWebsite] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState(
    "We are a forward-thinking technology company dedicated to building innovative software solutions, building high-performing teams, and driving digital transformation."
  );

  // Certificate and Verification states
  const [companyRegistrationNumber, setCompanyRegistrationNumber] = useState("");
  const [companyCertificate, setCompanyCertificate] = useState({
    public_id: "",
    url: "",
    fileName: "",
    uploadedAt: null,
  });
  const [verificationStatus, setVerificationStatus] = useState("Pending");
  const [isVerified, setIsVerified] = useState(false);
  const [verificationRemarks, setVerificationRemarks] = useState("");
  const [verifiedAt, setVerifiedAt] = useState(null);

  // Recruiter contact details
  const [recruiterName, setRecruiterName] = useState(user?.name || "Hiring Lead");
  const [recruiterTitle, setRecruiterTitle] = useState("Human Resources & Talent Acquisition Lead");
  const [phone, setPhone] = useState(user?.phone ? user.phone.toString() : "9876543210");
  // contactEmail is separate from account login email — used for job-application notifications
  const [contactEmail, setContactEmail] = useState("");

  // Perks list
  const [perks, setPerks] = useState([
    "Competitive Salary",
    "Health Insurance",
    "Flexible Work Hours",
    "Work From Home / Remote",
    "Annual Learning Budget",
    "Paid Time Off (PTO)",
  ]);

  // FAQ list
  const [faqs, setFaqs] = useState([]);
  const [tempFaqQ, setTempFaqQ] = useState("");
  const [tempFaqA, setTempFaqA] = useState("");

  // Modal State
  const [activeModal, setActiveModal] = useState(null);
  const [tempPerkInput, setTempPerkInput] = useState("");

  // Temporary Form States
  const [tempCompany, setTempCompany] = useState({
    name: "",
    industry: "",
    size: "",
    founded: "",
    website: "",
  });

  const [tempRecruiter, setTempRecruiter] = useState({
    name: "",
    title: "",
    phone: "",
    contactEmail: "",
  });

  const [tempRegNo, setTempRegNo] = useState("");

  // Load backend & localStorage data
  useEffect(() => {
    if (isAuthorized && user?.role === "Employer") {
      setRecruiterName(user.name || "Hiring Lead");
      setPhone(user.phone ? user.phone.toString() : "9876543210");

      // Load directly from MongoDB Atlas Employer collection
      fetchEmployerFullProfile()
        .then(({ profile: dbProfile }) => {
          const sanitizeLoc = (loc) => {
            if (!loc || loc === "Ahmedabad, Gujarat, INDIA" || loc === "Ahmedabad, INDIA") {
              return "";
            }
            return loc;
          };

          if (dbProfile) {
            if (dbProfile.companyName) setCompanyName(dbProfile.companyName);
            if (dbProfile.tagline) setTagline(dbProfile.tagline);
            if (dbProfile.industry) setIndustry(dbProfile.industry);
            if (dbProfile.companySize) setCompanySize(dbProfile.companySize);
            if (dbProfile.founded) setFounded(dbProfile.founded);
            if (dbProfile.website) setWebsite(dbProfile.website);
            setLocation(sanitizeLoc(dbProfile.location));
            if (dbProfile.description) setDescription(dbProfile.description);
            if (dbProfile.recruiterTitle) setRecruiterTitle(dbProfile.recruiterTitle);
            if (dbProfile.contactEmail) setContactEmail(dbProfile.contactEmail);
            if (dbProfile.perks?.length) setPerks(dbProfile.perks);
            if (dbProfile.faqs?.length) setFaqs(dbProfile.faqs);
            if (dbProfile.companyRegistrationNumber) setCompanyRegistrationNumber(dbProfile.companyRegistrationNumber);
            if (dbProfile.companyCertificate) setCompanyCertificate(dbProfile.companyCertificate);
            if (dbProfile.verificationStatus) setVerificationStatus(dbProfile.verificationStatus);
            if (dbProfile.isVerified !== undefined) setIsVerified(Boolean(dbProfile.isVerified || dbProfile.verificationStatus === "Approved"));
            if (dbProfile.verificationRemarks) setVerificationRemarks(dbProfile.verificationRemarks);
            if (dbProfile.verifiedAt) setVerifiedAt(dbProfile.verifiedAt);
          } else {
            const storageKey = `employer_company_${user._id}`;
            const saved = localStorage.getItem(storageKey);

            if (saved) {
              const parsed = JSON.parse(saved);
              setCompanyName(parsed.companyName || user.company?.name || "Acme Technologies");
              setTagline(parsed.tagline || "Empowering Careers & Driving Digital Innovation");
              setIndustry(parsed.industry || user.company?.industry || "Information Technology & Software");
              setCompanySize(parsed.companySize || user.company?.size || "51–200 employees");
              setFounded(parsed.founded || user.company?.founded || "2018");
              setWebsite(parsed.website || user.company?.website || "");
              setLocation(sanitizeLoc(parsed.location || user.company?.location));
              setDescription(parsed.description || user.company?.description || "We are a forward-thinking technology company...");
              setRecruiterTitle(parsed.recruiterTitle || "Talent Acquisition Lead");
              setPerks(parsed.perks || ["Competitive Salary", "Health Insurance", "Flexible Work Hours", "Work From Home / Remote"]);
              if (parsed.companyRegistrationNumber) setCompanyRegistrationNumber(parsed.companyRegistrationNumber);
            }
          }
        })
        .catch((err) => console.log("Employer profile fetch note:", err));
    }
  }, [isAuthorized, user]);

  // Save changes to localStorage and MongoDB Atlas Employer collection
  const persistEmployerData = (updatedFields = {}) => {
    if (!user || !user._id) return;
    const storageKey = `employer_company_${user._id}`;
    const payload = {
      companyName: updatedFields.companyName !== undefined ? updatedFields.companyName : companyName,
      tagline: updatedFields.tagline !== undefined ? updatedFields.tagline : tagline,
      industry: updatedFields.industry !== undefined ? updatedFields.industry : industry,
      companySize: updatedFields.companySize !== undefined ? updatedFields.companySize : companySize,
      founded: updatedFields.founded !== undefined ? updatedFields.founded : founded,
      website: updatedFields.website !== undefined ? updatedFields.website : website,
      location: updatedFields.location !== undefined ? updatedFields.location : location,
      description: updatedFields.description !== undefined ? updatedFields.description : description,
      recruiterTitle: updatedFields.recruiterTitle !== undefined ? updatedFields.recruiterTitle : recruiterTitle,
      contactEmail: updatedFields.contactEmail !== undefined ? updatedFields.contactEmail : contactEmail,
      perks: updatedFields.perks !== undefined ? updatedFields.perks : perks,
      faqs: updatedFields.faqs !== undefined ? updatedFields.faqs : faqs,
      companyRegistrationNumber: updatedFields.companyRegistrationNumber !== undefined ? updatedFields.companyRegistrationNumber : companyRegistrationNumber,
    };
    localStorage.setItem(storageKey, JSON.stringify(payload));

    // Save directly into MongoDB Atlas Employer collection
    updateEmployerFullProfileApi(payload).catch((err) =>
      console.log("MongoDB Employer Sync Note:", err)
    );
  };

  if (isLoading) {
    return <div className="loading">Loading Employer Profile...</div>;
  }

  if (!isAuthorized) return <Navigate to="/login" />;
  if (user?.role !== "Employer") return <Navigate to="/" />;

  // Profile picture handlers
  const handleAvatarClick = () => fileInputRef.current && fileInputRef.current.click();

  const handleProfilePictureChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only JPEG, PNG, GIF, and WebP images are allowed.");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      toast.error("Image must be smaller than 3MB.");
      return;
    }
    setUploadingPic(true);
    const formData = new FormData();
    formData.append("profilePicture", file);
    const result = await uploadProfilePictureApi(formData);
    if (result.success) {
      setUser((prev) => ({ ...prev, profilePicture: result.profilePicture }));
      toast.success("Profile picture updated! ✓");
    } else {
      toast.error(result.message || "Failed to upload profile picture.");
    }
    setUploadingPic(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDeleteProfilePicture = async () => {
    if (!user?.profilePicture?.url) {
      toast.error("No profile picture to delete.");
      return;
    }
    setUploadingPic(true);
    const result = await deleteProfilePictureApi();
    if (result.success) {
      setUser((prev) => ({ ...prev, profilePicture: { public_id: null, url: null } }));
      toast.success("Profile picture removed. Default avatar applied.");
    } else {
      toast.error(result.message || "Failed to delete profile picture.");
    }
    setUploadingPic(false);
  };

  const handleCertFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowedExtensions = [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png", ".webp"];
    const fileName = file.name.toLowerCase();
    const fileExt = fileName.includes(".") ? fileName.substring(fileName.lastIndexOf(".")) : "";
    if (!allowedExtensions.includes(fileExt)) {
      toast.error("Invalid file format. Please upload PDF, DOC, DOCX, JPG, PNG, or WEBP.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Certificate must be less than 10MB.");
      return;
    }
    setUploadingCert(true);
    const formData = new FormData();
    formData.append("companyCertificate", file);
    if (tempRegNo || companyRegistrationNumber) {
      formData.append("companyRegistrationNumber", (tempRegNo || companyRegistrationNumber).trim());
    }
    const result = await uploadCompanyCertificateApi(formData);
    if (result.success) {
      setCompanyCertificate(result.companyCertificate);
      setVerificationStatus("Pending");
      setIsVerified(false);
      toast.success("Certificate uploaded! Submitted for Admin verification.");
    } else {
      toast.error(result.message || "Failed to upload certificate.");
    }
    setUploadingCert(false);
    if (certFileInputRef.current) certFileInputRef.current.value = "";
  };

  // Quick link click handler
  const handleQuickLinkClick = (sectionId, modalType) => {
    if (modalType) {
      if (modalType === "companyDetails") {
        setTempCompany({
          name: companyName,
          industry: industry,
          size: companySize,
          founded: founded,
          website: website,
        });
      } else if (modalType === "recruiterContact") {
        setTempRecruiter({
          name: recruiterName,
          title: recruiterTitle,
          phone: phone,
          contactEmail: contactEmail,
        });
      } else if (modalType === "companyCertificate") {
        setTempRegNo(companyRegistrationNumber);
      }
      setActiveModal(modalType);
    } else {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Perks Handlers
  const handleAddPerk = (perkName) => {
    const trimmed = perkName.trim();
    if (!trimmed) return;
    if (perks.includes(trimmed)) {
      toast.error(`${trimmed} is already in company perks`);
      return;
    }
    const updated = [...perks, trimmed];
    setPerks(updated);
    persistEmployerData({ perks: updated });
  };

  const handleRemovePerk = (perkToRemove) => {
    const updated = perks.filter((p) => p !== perkToRemove);
    setPerks(updated);
    persistEmployerData({ perks: updated });
    toast.success(`Removed perk: ${perkToRemove}`);
  };

  // FAQ Handlers
  const handleAddFaq = () => {
    const q = tempFaqQ.trim();
    const a = tempFaqA.trim();
    if (!q || !a) {
      toast.error("Both question and answer are required.");
      return;
    }
    const updated = [...faqs, { question: q, answer: a }];
    setFaqs(updated);
    persistEmployerData({ faqs: updated });
    setTempFaqQ("");
    setTempFaqA("");
    toast.success("FAQ added!");
  };

  const handleRemoveFaq = (index) => {
    const updated = faqs.filter((_, i) => i !== index);
    setFaqs(updated);
    persistEmployerData({ faqs: updated });
    toast.success("FAQ removed.");
  };

  return (
    <section className="profile-page-container">
      <div className="profile-wrapper">
        {/* 1. TOP HEADER PROFILE CARD FOR EMPLOYER */}
        <div className="profile-header-card">
          <div className="profile-header-left">
            {/* Avatar with upload/delete support */}
            <div className="profile-avatar-box">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                style={{ display: "none" }}
                onChange={handleProfilePictureChange}
              />
              <div
                className={`profile-avatar-circle profile-avatar-clickable ${uploadingPic ? "uploading" : ""}`}
                onClick={handleAvatarClick}
                title="Click to change profile picture"
                style={!user?.profilePicture?.url ? { background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)", color: "#fff" } : {}}
              >
                {uploadingPic ? (
                  <div className="profile-avatar-spinner" />
                ) : user?.profilePicture?.url ? (
                  <img src={user?.profilePicture?.url} alt="Profile" className="profile-avatar-img" />
                ) : (
                  (companyName || user?.name || "C").charAt(0).toUpperCase()
                )}
                {!uploadingPic && (
                  <div className="profile-avatar-cam-overlay">
                    <FaCamera className="profile-cam-icon" />
                    <span>Change</span>
                  </div>
                )}
              </div>
              {user?.profilePicture?.url && !uploadingPic && (
                <button
                  className="profile-avatar-delete-btn"
                  onClick={handleDeleteProfilePicture}
                  title="Remove profile picture"
                >
                  <FaTrash /> Remove
                </button>
              )}
            </div>

            <div className="profile-header-details">
              <div className="profile-name-row">
                <h2>{companyName || "Acme Technologies"}</h2>
                {isVerified || verificationStatus === "Approved" ? (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      background: "#ecfdf5",
                      color: "#059669",
                      border: "1px solid #a7f3d0",
                      borderRadius: "20px",
                      padding: "2px 10px",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                    }}
                    title="Official Verified Company (Certificate Approved by Admin)"
                  >
                    ✓ Official Verified Employer
                  </span>
                ) : verificationStatus === "Rejected" ? (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      background: "#fef2f2",
                      color: "#dc2626",
                      border: "1px solid #fecaca",
                      borderRadius: "20px",
                      padding: "2px 10px",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                    }}
                    title="Verification was rejected. Please re-upload your certificate."
                  >
                    ⚠ Verification Rejected
                  </span>
                ) : (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      background: "#fffbeb",
                      color: "#d97706",
                      border: "1px solid #fde68a",
                      borderRadius: "20px",
                      padding: "2px 10px",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                    }}
                    title="Certificate submitted and awaiting Admin review"
                  >
                    ⏳ Verification Pending
                  </span>
                )}
                <button
                  className="edit-icon-btn"
                  onClick={() => handleQuickLinkClick(null, "companyDetails")}
                  title="Edit Company Info"
                >
                  <HiOutlinePencil />
                </button>
              </div>
              <p className="profile-updated-text">{tagline}</p>

              <div className="profile-meta-grid">
                <div className="profile-meta-item">
                  <HiOutlineOfficeBuilding className="meta-icon" />
                  <span>{industry}</span>
                </div>
                <div className="profile-meta-item">
                  <HiOutlineLocationMarker className="meta-icon" />
                  <span>{location || "Add office location"}</span>
                </div>
                <div className="profile-meta-item">
                  <HiOutlinePhone className="meta-icon" />
                  <span>{phone}</span>
                  <HiOutlineCheckCircle className="check-verified" />
                </div>
                <div className="profile-meta-item">
                  <HiOutlineMail className="meta-icon" />
                  <span>{user?.email || "hr@company.com"}</span>
                  <HiOutlineCheckCircle className="check-verified" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. MAIN CONTENT LAYOUT (2 COLUMNS) */}
        <div className="profile-body-grid">
          {/* LEFT COLUMN: QUICK LINKS */}
          <div className="profile-quick-links-card">
            <h4>Quick links</h4>
            <ul className="quick-links-list">
              <li onClick={() => handleQuickLinkClick("section-company", "companyDetails")}>
                <span>Company details</span>
                <span className="link-action text-blue">Edit</span>
              </li>
              <li onClick={() => handleQuickLinkClick("section-certificate", "companyCertificate")}>
                <span>Certificate & Verification</span>
                <span className="link-action text-blue">Manage</span>
              </li>
              <li onClick={() => handleQuickLinkClick("section-recruiter", "recruiterContact")}>
                <span>Contact & hiring lead</span>
                <span className="link-action text-blue">Edit</span>
              </li>
              <li onClick={() => handleQuickLinkClick("section-description", "companyDescription")}>
                <span>Company description</span>
                <span className="link-action text-blue">Edit</span>
              </li>
              <li onClick={() => handleQuickLinkClick("section-perks", "workPerks")}>
                <span>Work culture & perks</span>
                <span className="link-action text-blue">Add</span>
              </li>
              <li onClick={() => handleQuickLinkClick("section-location", "officeLocation")}>
                <span>Office location</span>
                <span className="link-action text-blue">Edit</span>
              </li>
              <li onClick={() => handleQuickLinkClick("section-faqs", "companyFAQs")}>
                <span>Company FAQs</span>
                <span className="link-action text-blue">Manage</span>
              </li>
              <li>
                <Link to="/job/me" style={{ display: "flex", justifyContent: "space-between", width: "100%", color: "inherit", textDecoration: "none" }}>
                  <span>Active posted jobs</span>
                  <span className="link-action text-blue">View</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* RIGHT COLUMN: PROFILE SECTIONS */}
          <div className="profile-main-content">
            {/* Posted Jobs Quick Link Banner */}
            <div className="profile-section-card" style={{ background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)", border: "1px solid #bfdbfe" }}>
              <div className="section-card-header">
                <div>
                  <h3 style={{ color: "#1e40af" }}>🚀 Manage Posted Jobs & Applicants</h3>
                  <p style={{ fontSize: "0.88rem", color: "#1e3a8a", margin: "4px 0 0 0" }}>
                    View all job postings, evaluate incoming applications, and hire candidates.
                  </p>
                </div>
                <Link to="/job/me" className="modal-btn-save" style={{ textDecoration: "none", display: "inline-block" }}>
                  View Your Jobs
                </Link>
              </div>
            </div>

            {/* Hidden Certificate File Input */}
            <input
              ref={certFileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
              style={{ display: "none" }}
              onChange={handleCertFileChange}
            />

            {/* Company Certificate & Verification Section */}
            <div id="section-certificate" className="profile-section-card">
              <div className="section-card-header">
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <HiOutlineShieldCheck style={{ color: isVerified ? "#059669" : "#2563eb", fontSize: "1.3rem" }} />
                  <h3>Company Certificate & Official Verification</h3>
                </div>
                <button className="section-edit-btn" onClick={() => handleQuickLinkClick(null, "companyCertificate")}>
                  <HiOutlinePencil /> Edit / Upload
                </button>
              </div>

              {/* Status Banner */}
              <div
                style={{
                  background: isVerified || verificationStatus === "Approved" ? "#ecfdf5" : verificationStatus === "Rejected" ? "#fef2f2" : "#fffbeb",
                  border: `1px solid ${isVerified || verificationStatus === "Approved" ? "#a7f3d0" : verificationStatus === "Rejected" ? "#fecaca" : "#fde68a"}`,
                  borderRadius: "12px",
                  padding: "14px 18px",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "10px",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontWeight: 700, fontSize: "0.95rem", color: isVerified || verificationStatus === "Approved" ? "#065f46" : verificationStatus === "Rejected" ? "#991b1b" : "#92400e" }}>
                      {isVerified || verificationStatus === "Approved"
                        ? "✓ Verified Company Profile"
                        : verificationStatus === "Rejected"
                        ? "⚠ Verification Rejected"
                        : "⏳ Verification In Progress"}
                    </span>
                  </div>
                  <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "#475569" }}>
                    {isVerified || verificationStatus === "Approved"
                      ? "Your company certificate has been reviewed and verified by Administrator. Jobseekers will see the official verified badge and certificate on your public company details page."
                      : verificationStatus === "Rejected"
                      ? verificationRemarks || "Your certificate was not approved by the admin. Please check details and re-upload a clear government/corporate registration document."
                      : "Your company certificate and registration number have been submitted and are currently awaiting Administrator verification."}
                  </p>
                </div>
                {verifiedAt && (
                  <span style={{ fontSize: "0.78rem", color: "#64748b", background: "rgba(255,255,255,0.7)", padding: "4px 10px", borderRadius: "8px" }}>
                    Verified on: {new Date(verifiedAt).toLocaleDateString()}
                  </span>
                )}
              </div>

              <div className="personal-details-grid">
                <div className="personal-detail-box" onClick={() => handleQuickLinkClick(null, "companyCertificate")}>
                  <span className="personal-detail-label">Company Registration No. (CIN / GSTIN)</span>
                  <span className="personal-detail-value">
                    {companyRegistrationNumber ? companyRegistrationNumber : (
                      <span style={{ color: "#9ca3af", fontStyle: "italic" }}>Not provided — Click to add</span>
                    )}
                  </span>
                </div>

                <div className="personal-detail-box" style={{ gridColumn: "1 / -1" }}>
                  <span className="personal-detail-label">Submitted Company Certificate Document</span>
                  {companyCertificate?.url ? (
                    <div
                      style={{
                        marginTop: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: "10px",
                        padding: "12px 16px",
                        flexWrap: "wrap",
                        gap: "10px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "8px",
                            background: "#eff6ff",
                            color: "#2563eb",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "1.3rem",
                          }}
                        >
                          <HiOutlineDocumentText />
                        </div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 600, fontSize: "0.92rem", color: "#0f172a" }}>
                            {companyCertificate.fileName || "Company_Certificate.pdf"}
                          </p>
                          <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                            {companyCertificate.uploadedAt
                              ? `Uploaded on ${new Date(companyCertificate.uploadedAt).toLocaleDateString()}`
                              : "Document uploaded"}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <a
                          href={companyCertificate.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="modal-btn-cancel"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "6px 12px",
                            fontSize: "0.85rem",
                            textDecoration: "none",
                          }}
                        >
                          <HiOutlineExternalLink /> View Certificate
                        </a>
                        <button
                          type="button"
                          className="modal-btn-save"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "6px 12px",
                            fontSize: "0.85rem",
                          }}
                          disabled={uploadingCert}
                          onClick={() => certFileInputRef.current && certFileInputRef.current.click()}
                        >
                          {uploadingCert ? "Uploading..." : "Replace File"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        marginTop: "8px",
                        padding: "14px",
                        background: "#f8fafc",
                        border: "1px dashed #cbd5e1",
                        borderRadius: "10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <span style={{ fontSize: "0.88rem", color: "#64748b" }}>
                        No certificate document uploaded yet. Upload your business license / certificate to get verified.
                      </span>
                      <button
                        type="button"
                        className="modal-btn-save"
                        style={{ padding: "6px 14px", fontSize: "0.85rem" }}
                        disabled={uploadingCert}
                        onClick={() => certFileInputRef.current && certFileInputRef.current.click()}
                      >
                        {uploadingCert ? "Uploading..." : "Upload Certificate"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Company Details Section */}
            <div id="section-company" className="profile-section-card">
              <div className="section-card-header">
                <h3>Company details</h3>
                <button className="section-edit-btn" onClick={() => handleQuickLinkClick(null, "companyDetails")}>
                  <HiOutlinePencil /> Edit
                </button>
              </div>
              <div className="personal-details-grid">
                <div className="personal-detail-box" onClick={() => handleQuickLinkClick(null, "companyDetails")}>
                  <span className="personal-detail-label">Company Name</span>
                  <span className="personal-detail-value">{companyName}</span>
                </div>
                <div className="personal-detail-box" onClick={() => handleQuickLinkClick(null, "companyDetails")}>
                  <span className="personal-detail-label">Industry</span>
                  <span className="personal-detail-value">{industry}</span>
                </div>
                <div className="personal-detail-box" onClick={() => handleQuickLinkClick(null, "companyDetails")}>
                  <span className="personal-detail-label">Company Size</span>
                  <span className="personal-detail-value">{companySize}</span>
                </div>
                <div className="personal-detail-box" onClick={() => handleQuickLinkClick(null, "companyDetails")}>
                  <span className="personal-detail-label">Founded Year</span>
                  <span className="personal-detail-value">{founded}</span>
                </div>
                <div className="personal-detail-box" onClick={() => handleQuickLinkClick(null, "companyDetails")}>
                  <span className="personal-detail-label">Official Website</span>
                  <span className="personal-detail-value blue-link-text">{website}</span>
                </div>
              </div>
            </div>

            {/* Contact & Hiring Lead Section */}
            <div id="section-recruiter" className="profile-section-card">
              <div className="section-card-header">
                <h3>Contact & hiring lead</h3>
                <button className="section-edit-btn" onClick={() => handleQuickLinkClick(null, "recruiterContact")}>
                  <HiOutlinePencil /> Edit
                </button>
              </div>
              <div className="personal-details-grid">
                <div className="personal-detail-box" onClick={() => handleQuickLinkClick(null, "recruiterContact")}>
                  <span className="personal-detail-label">Hiring Lead Name</span>
                  <span className="personal-detail-value">{recruiterName}</span>
                </div>
                <div className="personal-detail-box" onClick={() => handleQuickLinkClick(null, "recruiterContact")}>
                  <span className="personal-detail-label">Designation</span>
                  <span className="personal-detail-value">{recruiterTitle}</span>
                </div>
                <div className="personal-detail-box" onClick={() => handleQuickLinkClick(null, "recruiterContact")}>
                  <span className="personal-detail-label">Contact Phone</span>
                  <span className="personal-detail-value">{phone} ✓</span>
                </div>
                <div className="personal-detail-box" onClick={() => handleQuickLinkClick(null, "recruiterContact")}>
                  <span className="personal-detail-label">Application Contact Email</span>
                  <span className="personal-detail-value">
                    {contactEmail ? `${contactEmail} ✓` : (
                      <span style={{ color: "#9ca3af", fontStyle: "italic" }}>
                        Not set — account email will be used
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Company Description Section */}
            <div id="section-description" className="profile-section-card">
              <div className="section-card-header">
                <h3>Company description</h3>
                <button className="section-edit-btn" onClick={() => handleQuickLinkClick(null, "companyDescription")}>
                  <HiOutlinePencil /> Edit
                </button>
              </div>
              <p className="summary-paragraph">{description}</p>
            </div>

            {/* Work Culture & Perks Section */}
            <div id="section-perks" className="profile-section-card">
              <div className="section-card-header">
                <h3>Work culture & perks</h3>
                <button className="section-edit-btn" onClick={() => handleQuickLinkClick(null, "workPerks")}>
                  + Add Perks
                </button>
              </div>
              <div className="skills-tags-row">
                {perks.map((perk) => (
                  <span key={perk} className="profile-skill-chip-deletable" style={{ background: "#f0fdf4", color: "#166534", borderColor: "#bbf7d0" }}>
                    🎁 {perk}
                    <button
                      type="button"
                      onClick={() => handleRemovePerk(perk)}
                      className="chip-remove-btn"
                      style={{ color: "#166534" }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Office Location Section */}
            <div id="section-location" className="profile-section-card">
              <div className="section-card-header">
                <h3>Office location</h3>
                <button className="section-edit-btn" onClick={() => handleQuickLinkClick(null, "officeLocation")}>
                  <HiOutlinePencil /> Edit
                </button>
              </div>
              <div className="personal-details-grid">
                <div className="personal-detail-box" onClick={() => handleQuickLinkClick(null, "officeLocation")}>
                  <span className="personal-detail-label">Headquarters Address</span>
                  <span className="personal-detail-value">
                    {location ? `📍 ${location}` : "Add Headquarters Address"}
                  </span>
                </div>
              </div>
            </div>

            {/* Company FAQs Section */}
            <div id="section-faqs" className="profile-section-card">
              <div className="section-card-header">
                <h3>Company FAQs</h3>
                <button className="section-edit-btn" onClick={() => handleQuickLinkClick(null, "companyFAQs")}>
                  + Add FAQ
                </button>
              </div>
              {faqs.length === 0 ? (
                <p className="faq-empty-hint">No FAQs yet. Add common questions jobseekers ask about working here.</p>
              ) : (
                <div className="faq-employer-list">
                  {faqs.map((faq, i) => (
                    <div key={i} className="faq-employer-item">
                      <div className="faq-employer-qrow">
                        <span className="faq-q-badge">Q</span>
                        <p className="faq-employer-question">{faq.question}</p>
                        <button
                          type="button"
                          className="faq-delete-btn"
                          onClick={() => handleRemoveFaq(i)}
                          title="Remove FAQ"
                        >
                          <HiOutlineTrash />
                        </button>
                      </div>
                      <div className="faq-employer-arow">
                        <span className="faq-a-badge">A</span>
                        <p className="faq-employer-answer">{faq.answer}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* EMPLOYER INTERACTIVE MODALS                                              */}
      {/* ========================================================================= */}

      {/* 1. EDIT COMPANY DETAILS MODAL */}
      {activeModal === "companyDetails" && (
        <div className="profile-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="profile-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <h2>Company Details</h2>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}>
                <HiX />
              </button>
            </div>
            <p className="modal-subtext">Update core organization details visible to candidate applicants.</p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setCompanyName(tempCompany.name || companyName);
                setIndustry(tempCompany.industry || industry);
                setCompanySize(tempCompany.size || companySize);
                setFounded(tempCompany.founded || founded);
                setWebsite(tempCompany.website || website);

                persistEmployerData({
                  companyName: tempCompany.name || companyName,
                  industry: tempCompany.industry || industry,
                  companySize: tempCompany.size || companySize,
                  founded: tempCompany.founded || founded,
                  website: tempCompany.website || website,
                });

                setActiveModal(null);
                toast.success("Company details updated!");
              }}
            >
              <div className="modal-form-group">
                <label>Company Name *</label>
                <input
                  type="text"
                  className="modal-input"
                  value={tempCompany.name}
                  onChange={(e) => setTempCompany({ ...tempCompany, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid-2-col">
                <div className="modal-form-group">
                  <label>Industry</label>
                  <select
                    className="modal-select"
                    value={tempCompany.industry}
                    onChange={(e) => setTempCompany({ ...tempCompany, industry: e.target.value })}
                  >
                    {INDUSTRIES.map((ind) => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                  </select>
                </div>
                <div className="modal-form-group">
                  <label>Company Size</label>
                  <select
                    className="modal-select"
                    value={tempCompany.size}
                    onChange={(e) => setTempCompany({ ...tempCompany, size: e.target.value })}
                  >
                    {COMPANY_SIZES.map((sz) => (
                      <option key={sz} value={sz}>{sz}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid-2-col">
                <div className="modal-form-group">
                  <label>Founded Year</label>
                  <input
                    type="text"
                    className="modal-input"
                    value={tempCompany.founded}
                    onChange={(e) => setTempCompany({ ...tempCompany, founded: e.target.value })}
                  />
                </div>
                <div className="modal-form-group">
                  <label>Website URL</label>
                  <input
                    type="text"
                    className="modal-input"
                    value={tempCompany.website}
                    onChange={(e) => setTempCompany({ ...tempCompany, website: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-actions-row">
                <button type="button" className="modal-btn-cancel" onClick={() => setActiveModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="modal-btn-save">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. EDIT RECRUITER CONTACT MODAL */}
      {activeModal === "recruiterContact" && (
        <div className="profile-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="profile-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <h2>Contact & Hiring Lead</h2>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}>
                <HiX />
              </button>
            </div>
            <p className="modal-subtext">Update hiring contact person details.</p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setRecruiterName(tempRecruiter.name || recruiterName);
                setRecruiterTitle(tempRecruiter.title || recruiterTitle);
                setPhone(tempRecruiter.phone || phone);
                setContactEmail(tempRecruiter.contactEmail ?? contactEmail);

                persistEmployerData({
                  recruiterName: tempRecruiter.name || recruiterName,
                  recruiterTitle: tempRecruiter.title || recruiterTitle,
                  contactEmail: tempRecruiter.contactEmail ?? contactEmail,
                });

                setActiveModal(null);
                toast.success("Contact & Hiring Lead updated!");
              }}
            >
              <div className="grid-2-col">
                <div className="modal-form-group">
                  <label>Hiring Lead Name</label>
                  <input
                    type="text"
                    className="modal-input"
                    value={tempRecruiter.name}
                    onChange={(e) => setTempRecruiter({ ...tempRecruiter, name: e.target.value })}
                  />
                </div>
                <div className="modal-form-group">
                  <label>Designation / Role</label>
                  <input
                    type="text"
                    className="modal-input"
                    value={tempRecruiter.title}
                    onChange={(e) => setTempRecruiter({ ...tempRecruiter, title: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid-2-col">
                <div className="modal-form-group">
                  <label>Phone Number</label>
                  <input
                    type="text"
                    className="modal-input"
                    value={tempRecruiter.phone}
                    onChange={(e) => setTempRecruiter({ ...tempRecruiter, phone: e.target.value })}
                  />
                </div>
                <div className="modal-form-group">
                  <label>Account Email <span style={{ color: "#9ca3af", fontSize: "11px", fontWeight: 400 }}>(login email — read‑only)</span></label>
                  <input
                    type="email"
                    className="modal-input"
                    value={user?.email || ""}
                    readOnly
                    style={{ background: "#f3f4f6", color: "#6b7280", cursor: "not-allowed" }}
                  />
                </div>
              </div>

              <div className="modal-form-group">
                <label>
                  Application Contact Email
                  <span style={{ color: "#9ca3af", fontSize: "11px", fontWeight: 400, marginLeft: "6px" }}>
                    (job application notifications go here)
                  </span>
                </label>
                <input
                  type="email"
                  className="modal-input"
                  placeholder={`Leave blank to use account email (${user?.email || ""})`}
                  value={tempRecruiter.contactEmail || ""}
                  onChange={(e) => setTempRecruiter({ ...tempRecruiter, contactEmail: e.target.value })}
                />
                <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#6b7280" }}>
                  💡 When a jobseeker applies for one of your jobs, the notification email is sent to this address. Changing this does <strong>not</strong> affect your login credentials.
                </p>
              </div>

              <div className="modal-actions-row">
                <button type="button" className="modal-btn-cancel" onClick={() => setActiveModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="modal-btn-save">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. EDIT COMPANY DESCRIPTION MODAL */}
      {activeModal === "companyDescription" && (
        <div className="profile-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="profile-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <h2>Company Description</h2>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}>
                <HiX />
              </button>
            </div>
            <p className="modal-subtext">Describe your company's mission, products, and culture.</p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                persistEmployerData({ description });
                setActiveModal(null);
                toast.success("Company description updated!");
              }}
            >
              <div className="modal-form-group">
                <label>About the Company</label>
                <textarea
                  className="modal-textarea"
                  rows={6}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="modal-actions-row">
                <button type="button" className="modal-btn-cancel" onClick={() => setActiveModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="modal-btn-save">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. EDIT PERKS & BENEFITS MODAL */}
      {activeModal === "workPerks" && (
        <div className="profile-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="profile-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <h2>Work Culture & Perks</h2>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}>
                <HiX />
              </button>
            </div>
            <p className="modal-subtext">Add perks and employee benefits offered by your company.</p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (tempPerkInput.trim()) {
                  handleAddPerk(tempPerkInput.trim());
                  setTempPerkInput("");
                }
              }}
            >
              <div className="modal-form-group">
                <label>Company Perks</label>
                <div className="input-with-chips-box">
                  <div className="added-skills-row">
                    {perks.map((perk) => (
                      <span key={perk} className="modal-skill-tag" style={{ background: "#f0fdf4", color: "#166534" }}>
                        🎁 {perk}
                        <button type="button" onClick={() => handleRemovePerk(perk)}>
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Add perk (e.g. Health Insurance, Annual Bonus)"
                    value={tempPerkInput}
                    onChange={(e) => setTempPerkInput(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-actions-row">
                <button type="button" className="modal-btn-cancel" onClick={() => setActiveModal(null)}>
                  Cancel
                </button>
                <button type="button" className="modal-btn-save" onClick={() => setActiveModal(null)}>
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. EDIT OFFICE LOCATION MODAL */}
      {activeModal === "officeLocation" && (
        <div className="profile-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="profile-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <h2>Office Location</h2>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}>
                <HiX />
              </button>
            </div>
            <p className="modal-subtext">Update headquarters office location address.</p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                persistEmployerData({ location });
                setActiveModal(null);
                toast.success("Office location updated!");
              }}
            >
              <div className="modal-form-group">
                <label>Headquarters Address</label>
                <input
                  type="text"
                  className="modal-input"
                  placeholder="e.g. 101 Business Hub, Mumbai, India"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              <div className="modal-actions-row">
                <button type="button" className="modal-btn-cancel" onClick={() => setActiveModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="modal-btn-save">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MANAGE COMPANY FAQs MODAL */}
      {activeModal === "companyFAQs" && (
        <div className="profile-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="profile-modal-card faq-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <h2>Company FAQs</h2>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}>
                <HiX />
              </button>
            </div>
            <p className="modal-subtext">Add frequently asked questions visible to jobseekers on your company profile.</p>

            {/* Existing FAQs */}
            {faqs.length > 0 && (
              <div className="faq-modal-list">
                {faqs.map((faq, i) => (
                  <div key={i} className="faq-modal-item">
                    <div className="faq-modal-qrow">
                      <span className="faq-q-badge">Q</span>
                      <p className="faq-modal-qtext">{faq.question}</p>
                      <button
                        type="button"
                        className="faq-delete-btn"
                        onClick={() => handleRemoveFaq(i)}
                        title="Delete FAQ"
                      >
                        <HiOutlineTrash />
                      </button>
                    </div>
                    <div className="faq-modal-arow">
                      <span className="faq-a-badge">A</span>
                      <p className="faq-modal-atext">{faq.answer}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add New FAQ Form */}
            <div className="faq-add-divider">Add New FAQ</div>
            <div className="modal-form-group">
              <label>Question</label>
              <input
                type="text"
                className="modal-input"
                placeholder="e.g. What is the interview process like?"
                value={tempFaqQ}
                onChange={(e) => setTempFaqQ(e.target.value)}
              />
            </div>
            <div className="modal-form-group">
              <label>Answer</label>
              <textarea
                className="modal-textarea"
                rows={3}
                placeholder="e.g. We have 2 rounds — a technical screen and a cultural fit interview."
                value={tempFaqA}
                onChange={(e) => setTempFaqA(e.target.value)}
              />
            </div>

            <div className="modal-actions-row">
              <button type="button" className="modal-btn-cancel" onClick={() => setActiveModal(null)}>
                Close
              </button>
              <button type="button" className="modal-btn-save" onClick={handleAddFaq}>
                + Add FAQ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. MANAGE COMPANY CERTIFICATE & VERIFICATION MODAL */}
      {activeModal === "companyCertificate" && (
        <div className="profile-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="profile-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <h2>Company Certificate & Verification</h2>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}>
                <HiX />
              </button>
            </div>
            <p className="modal-subtext">
              Upload your official business license or registration certificate. Admin verifies your credentials to grant the official verified employer badge.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setCompanyRegistrationNumber(tempRegNo);
                persistEmployerData({ companyRegistrationNumber: tempRegNo });
                setActiveModal(null);
                toast.success("Company registration details updated!");
              }}
            >
              <div className="modal-form-group">
                <label>Company Registration Number (CIN / GSTIN / Reg No)</label>
                <input
                  type="text"
                  className="modal-input"
                  placeholder="e.g. U72200MH2018PTC123456 or 27AABCV1234M1Z5"
                  value={tempRegNo}
                  onChange={(e) => setTempRegNo(e.target.value)}
                />
              </div>

              {/* Upload Certificate File Area */}
              <div className="modal-form-group">
                <label>Company Certificate Document (PDF, JPG, PNG, DOCX - max 10MB)</label>
                <div
                  style={{
                    border: "2px dashed #cbd5e1",
                    borderRadius: "12px",
                    padding: "20px",
                    textAlign: "center",
                    background: "#f8fafc",
                    cursor: "pointer",
                    marginTop: "6px",
                  }}
                  onClick={() => certFileInputRef.current && certFileInputRef.current.click()}
                >
                  <HiOutlineDocumentText style={{ fontSize: "2.2rem", color: "#2563eb", marginBottom: "6px" }} />
                  {companyCertificate?.url ? (
                    <div>
                      <p style={{ margin: "4px 0", fontWeight: 600, color: "#0f172a" }}>
                        Current File: {companyCertificate.fileName || "Company_Certificate.pdf"}
                      </p>
                      <p style={{ margin: 0, fontSize: "0.82rem", color: "#64748b" }}>
                        Click here to replace with a new file
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p style={{ margin: "4px 0", fontWeight: 600, color: "#0f172a" }}>
                        Click to Browse & Upload Certificate
                      </p>
                      <p style={{ margin: 0, fontSize: "0.82rem", color: "#64748b" }}>
                        Supports PDF, PNG, JPG, DOC, DOCX up to 10MB
                      </p>
                    </div>
                  )}
                  {uploadingCert && (
                    <p style={{ color: "#2563eb", fontWeight: 600, marginTop: "8px" }}>
                      Uploading & submitting for Admin verification...
                    </p>
                  )}
                </div>
              </div>

              {companyCertificate?.url && (
                <div style={{ display: "flex", gap: "10px", marginTop: "10px", marginBottom: "16px" }}>
                  <a
                    href={companyCertificate.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="modal-btn-cancel"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      textDecoration: "none",
                      fontSize: "0.85rem",
                    }}
                  >
                    <HiOutlineExternalLink /> Preview Current Certificate
                  </a>
                </div>
              )}

              <div className="modal-actions-row">
                <button type="button" className="modal-btn-cancel" onClick={() => setActiveModal(null)}>
                  Close
                </button>
                <button type="submit" className="modal-btn-save">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default CompanyProfile;
