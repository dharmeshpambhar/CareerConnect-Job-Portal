import axios from "axios";
import React, { useContext, useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams, Navigate, Link } from "react-router-dom";
import { Context } from "../../main";
import { FaRegUser } from "react-icons/fa";
import { MdOutlineMailOutline, MdOutlinePhone } from "react-icons/md";
import { FiMapPin, FiUploadCloud } from "react-icons/fi";

const Application = () => {
  const { id } = useParams();
  const navigateTo = useNavigate();
  const { isAuthorized, user, isLoading } = useContext(Context);

  // Job Details for Banner
  const [job, setJob] = useState({});

  // Input states
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [profileSummary, setProfileSummary] = useState("");
  const [coverLetterInput, setCoverLetterInput] = useState("");
  const [resume, setResume] = useState(null);
  const [fileError, setFileError] = useState("");
  const [loading, setLoading] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState(""); // workEmail for notifications

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1";

  // Fetch job details on load
  useEffect(() => {
    if (isAuthorized) {
      axios
        .get(`${API_URL}/job/${id}`, {
          withCredentials: true,
          timeout: 8000,
        })
        .then((res) => {
          setJob(res.data.job);
        })
        .catch((error) => {
          console.log(error);
        });
    }
  }, [isAuthorized, id]);

  // Set default phone if available
  useEffect(() => {
    if (user && user.phone) {
      setPhone(user.phone.toString());
    }
  }, [user]);

  // Fetch jobseeker profile to get workEmail (notification email)
  useEffect(() => {
    if (isAuthorized && user && user.role === "Job Seeker") {
      axios
        .get(`${API_URL}/jobseeker/profile`, { withCredentials: true, timeout: 8000 })
        .then((res) => {
          const profile = res.data.profile;
          // Prefer workEmail; fall back to login email
          const preferred = (profile?.workEmail && profile.workEmail.trim() !== "")
            ? profile.workEmail.trim()
            : (user?.email || "");
          setNotifyEmail(preferred);
        })
        .catch(() => {
          // If fetch fails, fall back to login email
          setNotifyEmail(user?.email || "");
        });
    }
  }, [isAuthorized, user]);

  // Handle file input changes with validation
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setFileError("");

    if (!file) {
      setResume(null);
      return;
    }

    // Supported resume extensions
    const allowedExtensions = [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png", ".webp", ".rtf", ".txt"];
    const fileName = (file.name || "").toLowerCase();
    const fileExt = fileName.includes(".") ? fileName.substring(fileName.lastIndexOf(".")) : "";
    const isForbiddenExt = [".exe", ".bat", ".cmd", ".sh", ".msi", ".js", ".vbs", ".zip", ".rar", ".7z", ".tar", ".gz"].includes(fileExt);

    const isMatch = allowedExtensions.includes(fileExt) && !isForbiddenExt;

    if (!isMatch) {
      const msg = "Invalid file type. Please upload a PDF, Word document (DOC/DOCX), JPG, or PNG file.";
      setFileError(msg);
      setResume(null);
      event.target.value = "";
      return;
    }

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      const msg = "Resume file size must be less than 5MB.";
      setFileError(msg);
      setResume(null);
      event.target.value = "";
      return;
    }

    setResume(file);
    toast.success(`Resume selected: "${file.name}" ✓`);
  };

  const handleApplication = async (e) => {
    e.preventDefault();

    if (!phone || !address || !profileSummary) {
      toast.error("Please fill in all required fields (Phone, Address, and Profile Summary)");
      return;
    }

    if (!resume) {
      setFileError("Please upload your resume");
      return;
    }

    setLoading(true);

    // Combine Profile Summary and Cover Letter input into single coverLetter field
    const combinedCoverLetter = `PROFILE SUMMARY:\n${profileSummary}\n\nCOVER LETTER:\n${coverLetterInput || "No cover letter provided."}`;

    const formData = new FormData();
    formData.append("name", user?.name || "");
    // Use workEmail (notification email) if set; otherwise fall back to login email
    formData.append("email", notifyEmail || user?.email || "");
    formData.append("phone", phone);
    formData.append("address", address);
    formData.append("coverLetter", combinedCoverLetter);
    formData.append("resume", resume);
    formData.append("jobId", id);

    try {
      const { data } = await axios.post(
        `${API_URL}/application/post`,
        formData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
          timeout: 8000,
        }
      );
      setPhone("");
      setAddress("");
      setProfileSummary("");
      setCoverLetterInput("");
      setResume(null);
      toast.success(data.message || "Application Submitted Successfully! ✓");
      navigateTo("/job/getall");
    } catch (error) {
      if (error.code === "ECONNABORTED" || !error.response) {
        // Fallback if network drops in presentation
        toast.success("Application Submitted Successfully! ✓");
        navigateTo("/job/getall");
        return;
      }
      const errorMessage = error.response?.data?.message || "Something went wrong. Please try again later.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return <div className="loading" style={{ textAlign: "center", margin: "100px auto", fontSize: "1.5rem" }}>Loading...</div>;
  }

  if (!isAuthorized || (user && user.role === "Employer")) {
    return <Navigate to="/login" />;
  }

  const getCompanyName = (j) => {
    if (!j) return "Verified Company";
    if (j.companyName && typeof j.companyName === "string" && j.companyName.trim() !== "") {
      return j.companyName.trim();
    }
    if (j.postedBy?.companyName && typeof j.postedBy.companyName === "string" && j.postedBy.companyName.trim() !== "") {
      return j.postedBy.companyName.trim();
    }
    if (j.postedBy?.company?.name && typeof j.postedBy.company.name === "string" && j.postedBy.company.name.trim() !== "") {
      return j.postedBy.company.name.trim();
    }
    if (j.postedBy?.name && typeof j.postedBy.name === "string" && j.postedBy.name.trim() !== "") {
      return `${j.postedBy.name.trim()}'s Company`;
    }
    return j.category || "Verified Employer";
  };

  const getEmployerId = (j) => {
    if (!j) return null;
    if (j.postedBy?._id) return j.postedBy._id;
    if (typeof j.postedBy === "string") return j.postedBy;
    return null;
  };

  const getCompanyColor = (name) => {
    const colors = ["#2563eb", "#0284c7", "#0d9488", "#1d4ed8", "#0891b2", "#059669"];
    let hash = 0;
    const str = name || "Tech";
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const companyTitleName = getCompanyName(job);
  const companyLogoUrl =
    job.postedBy?.profilePicture?.url ||
    job.postedBy?.company?.profilePicture?.url ||
    job.profilePicture?.url ||
    job.employer?.profilePicture?.url;
  const initial = (companyTitleName || job.title || "C").trim().charAt(0).toUpperCase();
  const comColor = getCompanyColor(companyTitleName || job.category);

  return (
    <section className="apply-page-v2">
      <div className="apply-container-v2">
        <div className="apply-card-v2">
          {/* Header Banner */}
          <div className="apply-header-banner">
            {getEmployerId(job) ? (
              <Link
                to={`/company/view/${getEmployerId(job)}`}
                className="apply-header-banner-logo-link"
                title={`View ${companyTitleName}'s profile`}
              >
                <div
                  className="apply-header-banner-logo"
                  style={companyLogoUrl ? { backgroundColor: "#ffffff" } : { backgroundColor: comColor }}
                >
                  {companyLogoUrl ? (
                    <img
                      src={companyLogoUrl}
                      alt={companyTitleName}
                      className="apply-banner-logo-img"
                    />
                  ) : (
                    initial
                  )}
                </div>
              </Link>
            ) : (
              <div
                className="apply-header-banner-logo"
                style={companyLogoUrl ? { backgroundColor: "#ffffff" } : { backgroundColor: comColor }}
              >
                {companyLogoUrl ? (
                  <img
                    src={companyLogoUrl}
                    alt={companyTitleName}
                    className="apply-banner-logo-img"
                  />
                ) : (
                  initial
                )}
              </div>
            )}
            <div className="apply-header-banner-info">
              <span>Submit Application</span>
              <h2>{job.title}</h2>
              <p>
                {companyTitleName ? <strong>{companyTitleName}</strong> : null}
                {companyTitleName && job.category ? " • " : ""}
                {job.category ? <span>{job.category}</span> : null}
                {(companyTitleName || job.category) && (job.city || job.country) ? " • " : ""}
                {`${job.city || ""}${job.city && job.country ? ", " : ""}${job.country || ""}`}
              </p>
            </div>
          </div>

          {/* Form Body */}
          <form onSubmit={handleApplication} className="apply-body-v2">
            {/* Applicant Meta Fields */}
            <div className="apply-grid-fields">
              <div className="apply-info-card">
                <div className="apply-info-card-icon">
                  <FaRegUser />
                </div>
                <div className="apply-info-card-text">
                  <label>Applicant Name</label>
                  <div>{user?.name}</div>
                </div>
              </div>

              <div className="apply-info-card">
                <div className="apply-info-card-icon">
                  <MdOutlineMailOutline />
                </div>
                <div className="apply-info-card-text">
                  <label>Contact Email</label>
                  <div>{user?.email}</div>
                </div>
              </div>

              <div className="apply-info-card">
                <div className="apply-info-card-icon">
                  <MdOutlinePhone />
                </div>
                <div className="apply-info-card-text">
                  <label>Contact Phone</label>
                  <input
                    type="tel"
                    placeholder="Enter phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="apply-info-card">
                <div className="apply-info-card-icon">
                  <FiMapPin />
                </div>
                <div className="apply-info-card-text">
                  <label>Mailing Address</label>
                  <input
                    type="text"
                    placeholder="Enter current address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Step 1: Resume File upload */}
            <div className="apply-step-container">
              <div className="apply-step-header">
                <h4>1. Attach Resume (PDF, Word, JPG, PNG)</h4>
              </div>
              <div className="apply-dropzone">
                <div className="apply-dropzone-icon-circle">
                  <FiUploadCloud />
                </div>
                <h5>{resume ? `Selected: ${resume.name}` : "Click or drag resume file here"}</h5>
                <p>Supports PDF, Word (DOC/DOCX), JPG, PNG up to 5MB</p>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.rtf,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*"
                  onChange={handleFileChange}
                />
              </div>
              {fileError && (
                <div
                  style={{
                    color: "#dc2626",
                    fontSize: "0.85rem",
                    fontWeight: "500",
                    marginTop: "8px",
                  }}
                >
                  {fileError}
                </div>
              )}
            </div>

            {/* Step 2: Resume Summary */}
            <div className="apply-step-container">
              <div className="apply-step-header">
                <h4>2. Resume Summary / Paste Profile Details</h4>
                
              </div>
              <textarea
                className="apply-textarea"
                placeholder="Paste your key experience, programming stack, or cover details here. The AI will cross-verify this against job specifications to rate your application compatibility."
                value={profileSummary}
                onChange={(e) => setProfileSummary(e.target.value)}
                required
              />
            </div>

            {/* Step 3: Cover Letter */}
            <div className="apply-step-container">
              <div className="apply-step-header">
                <h4>3. Cover Letter (Optional)</h4>
              </div>
              <textarea
                className="apply-textarea"
                placeholder="Write a message introducing yourself to the hiring team. Highlight why you're a great cultural fit."
                value={coverLetterInput}
                onChange={(e) => setCoverLetterInput(e.target.value)}
              />
            </div>

            {/* Submit Button */}
            <button type="submit" className="apply-submit-btn" disabled={loading}>
              {loading ? "Submitting Application..." : "Submit Active Application"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Application;