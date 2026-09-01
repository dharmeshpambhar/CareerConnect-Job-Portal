import axios from "axios";
import React, { useContext, useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams, Navigate } from "react-router-dom";
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

  // Fetch job details on load
  useEffect(() => {
    if (isAuthorized) {
      axios
        .get(`http://localhost:4000/api/v1/job/${id}`, {
          withCredentials: true,
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

  // Handle file input changes with validation
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setFileError("");

    if (!file) {
      setResume(null);
      return;
    }

    // Check file type (PNG, JPEG, WEBP)
    const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setFileError("Please select a valid image file (PNG, JPEG, or WEBP)");
      setResume(null);
      return;
    }

    // Check file size (limit to 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setFileError("File size should be less than 2MB");
      setResume(null);
      return;
    }

    setResume(file);
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
    formData.append("email", user?.email || "");
    formData.append("phone", phone);
    formData.append("address", address);
    formData.append("coverLetter", combinedCoverLetter);
    formData.append("resume", resume);
    formData.append("jobId", id);

    try {
      const { data } = await axios.post(
        "http://localhost:4000/api/v1/application/post",
        formData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setPhone("");
      setAddress("");
      setProfileSummary("");
      setCoverLetterInput("");
      setResume(null);
      toast.success(data.message);
      navigateTo("/job/getall");
    } catch (error) {
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

  const initial = (job.category || "J").trim().charAt(0).toUpperCase();
  const comColor = job.category ? "#6366f1" : "#1e293b";

  return (
    <section className="apply-page-v2">
      <div className="apply-container-v2">
        <div className="apply-card-v2">
          {/* Header Banner */}
          <div className="apply-header-banner">
            <div className="apply-header-banner-logo" style={{ backgroundColor: comColor }}>
              {initial}
            </div>
            <div className="apply-header-banner-info">
              <span>Submit Application</span>
              <h2>{job.title}</h2>
              <p>{`${job.category || ""} • ${job.city || ""}, ${job.country || ""}`}</p>
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
                <h4>1. Attach Image Resume</h4>
              </div>
              <div className="apply-dropzone">
                <div className="apply-dropzone-icon-circle">
                  <FiUploadCloud />
                </div>
                <h5>{resume ? `Selected: ${resume.name}` : "Click or drag resume image here"}</h5>
                <p>Supports PNG, JPEG, WEBP up to 2MB</p>
                <input type="file" accept="image/*" onChange={handleFileChange} />
              </div>
              {fileError && <div style={{ color: "#ef4444", fontSize: "0.82rem", fontWeight: "600" }}>{fileError}</div>}
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