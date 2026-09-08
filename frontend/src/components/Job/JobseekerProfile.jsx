import React, { useContext, useState, useEffect, useRef } from "react";
import { Context } from "../../main";
import { Navigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  HiOutlinePencil,
  HiOutlineCheckCircle,
  HiOutlineLocationMarker,
  HiOutlinePhone,
  HiOutlineMail,
  HiOutlineCloudUpload,
  HiOutlineTrash,
  HiOutlineDocumentText,
  HiOutlineExternalLink,
  HiOutlineRefresh,
  HiX,
} from "react-icons/hi";
import { FaCamera, FaTrash, FaFilePdf } from "react-icons/fa";
import {
  fetchJobseekerProfile,
  updateJobseekerProfileApi,
  uploadProfilePictureApi,
  deleteProfilePictureApi,
  uploadResumeApi,
  deleteResumeApi,
} from "../../apiService";

const JobseekerProfile = () => {
  const { isAuthorized, user, setUser, isLoading } = useContext(Context);
  const fileInputRef = useRef(null);
  const resumeInputRef = useRef(null);

  // Dynamic user specific states
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [workEmail, setWorkEmail] = useState("");
  const [location, setLocation] = useState("");
  const [disabilityStatus, setDisabilityStatus] = useState("I don't have a disability");
  const [disabilitySubmitted, setDisabilitySubmitted] = useState(false);
  const [uploadingPic, setUploadingPic] = useState(false);

  // Persistent Resume state
  const [resumeData, setResumeData] = useState(null);
  const [uploadingResume, setUploadingResume] = useState(false);

  // User profile section lists
  const [keySkills, setKeySkills] = useState([]);
  const [educationList, setEducationList] = useState([]);
  const [itSkillsList, setItSkillsList] = useState([]);
  const [projectsList, setProjectsList] = useState([]);
  const [profileSummary, setProfileSummary] = useState("");

  const [personalDetails, setPersonalDetails] = useState({
    dob: "",
    gender: "Male",
    maritalStatus: "Single",
    category: "General",
    languages: "",
    workPermit: "",
    address: "",
  });

  // Modal & Index States for Editing
  const [activeModal, setActiveModal] = useState(null);
  const [editingEduIndex, setEditingEduIndex] = useState(null);
  const [editingItSkillIndex, setEditingItSkillIndex] = useState(null);
  const [editingProjectIndex, setEditingProjectIndex] = useState(null);

  // Temp Form Inputs for Modals
  const [tempSkillInput, setTempSkillInput] = useState("");

  // Temp Education State
  const [tempEdu, setTempEdu] = useState({
    degree: "Masters/Post-Graduation",
    institute: "",
    course: "MCA",
    specialization: "",
    courseType: "Full time",
    startYear: "2022",
    endYear: "2026",
    gradingSystem: "Scale 10 Grading System",
    grade: "",
  });

  // Temp IT Skill State
  const [tempItSkill, setTempItSkill] = useState({
    name: "",
    version: "",
    lastUsed: "2026",
    expYears: "1",
    expMonths: "0",
  });

  // Temp Project State
  const [tempProject, setTempProject] = useState({
    title: "",
    client: "",
    status: "In progress",
    year: "2026",
    month: "August",
    details: "",
  });

  // Load user specific data on mount or user change
  useEffect(() => {
    if (user && user._id) {
      setPhone(user.phone ? user.phone.toString() : "");
      setEmail(user.email || "");

      // First try fetching profile directly from MongoDB Atlas collection
      fetchJobseekerProfile()
        .then(({ profile: dbProfile }) => {
          if (dbProfile) {
            if (dbProfile.location) setLocation(dbProfile.location);
            if (dbProfile.workEmail) setWorkEmail(dbProfile.workEmail);
            if (dbProfile.keySkills?.length) setKeySkills(dbProfile.keySkills);
            if (dbProfile.educationList?.length) setEducationList(dbProfile.educationList);
            if (dbProfile.itSkillsList?.length) setItSkillsList(dbProfile.itSkillsList);
            if (dbProfile.projectsList?.length) setProjectsList(dbProfile.projectsList);
            if (dbProfile.profileSummary) setProfileSummary(dbProfile.profileSummary);
            if (dbProfile.personalDetails) {
              setPersonalDetails((prev) => ({
                ...prev,
                ...dbProfile.personalDetails,
                gender: dbProfile.personalDetails.gender || "Male",
                maritalStatus: dbProfile.personalDetails.maritalStatus || "Single",
                category: dbProfile.personalDetails.category || "General",
              }));
            }
            if (dbProfile.resume && (dbProfile.resume.url || dbProfile.resume.name)) {
              setResumeData(dbProfile.resume);
            }
          } else {
            // Fallback to local storage
            const storageKey = `jobseeker_profile_${user._id}`;
            const savedData = localStorage.getItem(storageKey);
            if (savedData) {
              const parsed = JSON.parse(savedData);
              setLocation(parsed.location || "Ahmedabad, INDIA");
              setKeySkills(parsed.keySkills || ["React.js", "JavaScript", "SQL", "Node.js", "Python"]);
              setEducationList(parsed.educationList || []);
              setItSkillsList(parsed.itSkillsList || []);
              setProjectsList(parsed.projectsList || []);
              setProfileSummary(parsed.profileSummary || "");
              if (parsed.personalDetails) {
                setPersonalDetails((prev) => ({
                  ...prev,
                  ...parsed.personalDetails,
                  gender: parsed.personalDetails.gender || "Male",
                  maritalStatus: parsed.personalDetails.maritalStatus || "Single",
                  category: parsed.personalDetails.category || "General",
                }));
              }
              if (parsed.resume) setResumeData(parsed.resume);
            }
          }
        })
        .catch(() => {
          // Fallback initial defaults
          setLocation("Ahmedabad, INDIA");
          setKeySkills(["React.js", "JavaScript", "SQL", "Node.js", "Python"]);
          const storageKey = `jobseeker_profile_${user._id}`;
          const savedData = localStorage.getItem(storageKey);
          if (savedData) {
            try {
              const parsed = JSON.parse(savedData);
              if (parsed.resume) setResumeData(parsed.resume);
            } catch (e) {}
          }
        });
    }
  }, [user]);

  // Helper to persist current user data into LocalStorage & MongoDB Atlas Collection
  const persistUserData = (updatedFields = {}) => {
    if (!user || !user._id) return;
    const storageKey = `jobseeker_profile_${user._id}`;
    const payload = {
      location: updatedFields.location !== undefined ? updatedFields.location : location,
      workEmail: updatedFields.workEmail !== undefined ? updatedFields.workEmail : workEmail,
      keySkills: updatedFields.keySkills !== undefined ? updatedFields.keySkills : keySkills,
      educationList: updatedFields.educationList !== undefined ? updatedFields.educationList : educationList,
      itSkillsList: updatedFields.itSkillsList !== undefined ? updatedFields.itSkillsList : itSkillsList,
      projectsList: updatedFields.projectsList !== undefined ? updatedFields.projectsList : projectsList,
      profileSummary: updatedFields.profileSummary !== undefined ? updatedFields.profileSummary : profileSummary,
      personalDetails: updatedFields.personalDetails !== undefined ? updatedFields.personalDetails : personalDetails,
      phone: phone,
      email: email,
    };
    localStorage.setItem(storageKey, JSON.stringify(payload));
    
    // Save directly into MongoDB Atlas JobseekerProfile collection
    updateJobseekerProfileApi(payload).catch((err) =>
      console.log("MongoDB Profile Sync Note:", err)
    );
  };

  if (isLoading) {
    return <div className="loading">Loading Profile...</div>;
  }

  if (!isAuthorized) {
    return <Navigate to="/login" />;
  }

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

  // Persistent Resume Upload & Delete Handlers
  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedExtensions = [".pdf", ".doc", ".docx", ".rtf", ".png", ".jpg", ".jpeg", ".webp"];
    const fileName = file.name || "resume";
    const fileExt = fileName.substring(fileName.lastIndexOf(".")).toLowerCase();

    if (!allowedExtensions.includes(fileExt)) {
      toast.error("Supported formats: PDF, DOC, DOCX, RTF, PNG, JPEG, WEBP up to 5MB");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Resume file must be smaller than 5MB.");
      return;
    }

    setUploadingResume(true);
    const formData = new FormData();
    formData.append("resume", file);

    const res = await uploadResumeApi(formData);
    if (res.success && res.resume) {
      setResumeData(res.resume);
      setUser((prev) => ({ ...prev, resume: res.resume }));
      const storageKey = `jobseeker_profile_${user._id}`;
      const existing = JSON.parse(localStorage.getItem(storageKey) || "{}");
      localStorage.setItem(storageKey, JSON.stringify({ ...existing, resume: res.resume }));
      toast.success(`Resume "${res.resume.name || file.name}" uploaded & saved! ✓`);
    } else {
      toast.error(res.message || "Failed to upload resume.");
    }
    setUploadingResume(false);
    if (resumeInputRef.current) resumeInputRef.current.value = "";
  };

  const handleDeleteResume = async () => {
    if (!resumeData?.url && !resumeData?.name) return;
    setUploadingResume(true);
    const res = await deleteResumeApi();
    if (res.success) {
      setResumeData(null);
      setUser((prev) => ({ ...prev, resume: null }));
      const storageKey = `jobseeker_profile_${user._id}`;
      const existing = JSON.parse(localStorage.getItem(storageKey) || "{}");
      delete existing.resume;
      localStorage.setItem(storageKey, JSON.stringify(existing));
      toast.success("Resume removed successfully!");
    } else {
      toast.error(res.message || "Failed to delete resume.");
    }
    setUploadingResume(false);
  };

  // Quick link scroll / trigger handler
  const handleQuickLinkClick = (sectionId, modalType) => {
    if (modalType) {
      if (modalType === "education") {
        setEditingEduIndex(null);
        setTempEdu({
          degree: "Masters/Post-Graduation",
          institute: "",
          course: "MCA",
          specialization: "",
          courseType: "Full time",
          startYear: "2022",
          endYear: "2026",
          gradingSystem: "Scale 10 Grading System",
          grade: "",
        });
      } else if (modalType === "itSkills") {
        setEditingItSkillIndex(null);
        setTempItSkill({
          name: "",
          version: "",
          lastUsed: "2026",
          expYears: "1",
          expMonths: "0",
        });
      } else if (modalType === "projects") {
        setEditingProjectIndex(null);
        setTempProject({
          title: "",
          client: "",
          status: "In progress",
          year: "2026",
          month: "August",
          details: "",
        });
      }
      setActiveModal(modalType);
    } else {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Skill Handlers
  const handleAddSkill = (skillName) => {
    const trimmed = skillName.trim();
    if (!trimmed) return;
    if (keySkills.includes(trimmed)) {
      toast.error(`${trimmed} is already added`);
      return;
    }
    const updated = [...keySkills, trimmed];
    setKeySkills(updated);
    persistUserData({ keySkills: updated });
  };

  const handleRemoveSkill = (skillToRemove) => {
    const updated = keySkills.filter((s) => s !== skillToRemove);
    setKeySkills(updated);
    persistUserData({ keySkills: updated });
    toast.success(`Removed skill: ${skillToRemove}`);
  };

  // Education Handlers (Add, Edit, Remove)
  const handleOpenAddEducation = () => {
    setEditingEduIndex(null);
    setTempEdu({
      degree: "Masters/Post-Graduation",
      institute: "",
      course: "MCA",
      specialization: "",
      courseType: "Full time",
      startYear: "2022",
      endYear: "2026",
      gradingSystem: "Scale 10 Grading System",
      grade: "",
    });
    setActiveModal("education");
  };

  const handleOpenEditEducation = (index) => {
    setEditingEduIndex(index);
    setTempEdu({ ...educationList[index] });
    setActiveModal("education");
  };

  const handleRemoveEducation = (index) => {
    const updated = educationList.filter((_, idx) => idx !== index);
    setEducationList(updated);
    persistUserData({ educationList: updated });
    toast.success("Education entry removed");
  };

  const handleSaveEducation = (e) => {
    e.preventDefault();
    if (!tempEdu.institute || !tempEdu.course) {
      toast.error("Please enter Institute and Course");
      return;
    }
    let updated;
    if (editingEduIndex !== null) {
      updated = [...educationList];
      updated[editingEduIndex] = tempEdu;
      toast.success("Education details updated!");
    } else {
      updated = [...educationList, tempEdu];
      toast.success("Education details added!");
    }
    setEducationList(updated);
    persistUserData({ educationList: updated });
    setActiveModal(null);
  };

  // IT Skill Handlers (Add, Edit, Remove)
  const handleOpenAddItSkill = () => {
    setEditingItSkillIndex(null);
    setTempItSkill({
      name: "",
      version: "",
      lastUsed: "2026",
      expYears: "1",
      expMonths: "0",
    });
    setActiveModal("itSkills");
  };

  const handleOpenEditItSkill = (index) => {
    setEditingItSkillIndex(index);
    setTempItSkill({ ...itSkillsList[index] });
    setActiveModal("itSkills");
  };

  const handleRemoveItSkill = (index) => {
    const updated = itSkillsList.filter((_, idx) => idx !== index);
    setItSkillsList(updated);
    persistUserData({ itSkillsList: updated });
    toast.success("IT Skill entry removed");
  };

  const handleSaveItSkill = (e) => {
    e.preventDefault();
    if (!tempItSkill.name) {
      toast.error("Please enter skill/software name");
      return;
    }
    let updated;
    if (editingItSkillIndex !== null) {
      updated = [...itSkillsList];
      updated[editingItSkillIndex] = tempItSkill;
      toast.success("IT Skill updated!");
    } else {
      updated = [...itSkillsList, tempItSkill];
      toast.success("IT Skill added!");
    }
    setItSkillsList(updated);
    persistUserData({ itSkillsList: updated });
    setActiveModal(null);
  };

  // Project Handlers (Add, Edit, Remove)
  const handleOpenAddProject = () => {
    setEditingProjectIndex(null);
    setTempProject({
      title: "",
      client: "",
      status: "In progress",
      year: "2026",
      month: "August",
      details: "",
    });
    setActiveModal("projects");
  };

  const handleOpenEditProject = (index) => {
    setEditingProjectIndex(index);
    setTempProject({ ...projectsList[index] });
    setActiveModal("projects");
  };

  const handleRemoveProject = (index) => {
    const updated = projectsList.filter((_, idx) => idx !== index);
    setProjectsList(updated);
    persistUserData({ projectsList: updated });
    toast.success("Project entry removed");
  };

  const handleSaveProject = (e) => {
    e.preventDefault();
    if (!tempProject.title || !tempProject.client) {
      toast.error("Please enter project title and client");
      return;
    }
    let updated;
    if (editingProjectIndex !== null) {
      updated = [...projectsList];
      updated[editingProjectIndex] = tempProject;
      toast.success("Project updated!");
    } else {
      updated = [...projectsList, tempProject];
      toast.success("Project added!");
    }
    setProjectsList(updated);
    persistUserData({ projectsList: updated });
    setActiveModal(null);
  };

  // Suggested skills array
  const suggestedSkills = [
    "Java",
    "SQL",
    "Angular",
    "Javascript",
    "Python",
    "AWS",
    "React.Js",
    "HTML",
    "REST",
    "CSS",
  ];

  return (
    <section className="profile-page-container">
      <div className="profile-wrapper">
        {/* 1. TOP HEADER PROFILE CARD */}
        <div className="profile-header-card">
          <div className="profile-header-left">
            <div className="profile-avatar-box">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                style={{ display: "none" }}
                onChange={handleProfilePictureChange}
              />
              {/* Clickable avatar */}
              <div
                className={`profile-avatar-circle profile-avatar-clickable ${uploadingPic ? "uploading" : ""}`}
                onClick={handleAvatarClick}
                title="Click to change profile picture"
              >
                {uploadingPic ? (
                  <div className="profile-avatar-spinner" />
                ) : user?.profilePicture?.url ? (
                  <img src={user?.profilePicture?.url} alt="Profile" className="profile-avatar-img" />
                ) : (
                  (user?.name || "J").charAt(0).toUpperCase()
                )}
                {!uploadingPic && (
                  <div className="profile-avatar-cam-overlay">
                    <FaCamera className="profile-cam-icon" />
                    <span>Change</span>
                  </div>
                )}
              </div>
              {/* Delete button — only shown if custom picture exists */}
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
                <h2>{user?.name || "Jobseeker"}</h2>
                <button
                  className="edit-icon-btn"
                  onClick={() => setActiveModal("headerInfo")}
                  title="Edit Contact & Location Info"
                >
                  <HiOutlinePencil />
                </button>
              </div>
              <p className="profile-updated-text">Profile last updated - Today</p>

              <div className="profile-meta-grid">
                <div className="profile-meta-item">
                  <HiOutlineLocationMarker className="meta-icon" />
                  <span>{location || "Add Location"}</span>
                </div>
                <div className="profile-meta-item">
                  <HiOutlinePhone className="meta-icon" />
                  <span>{phone || "Add Phone"}</span>
                  {phone && <HiOutlineCheckCircle className="check-verified" />}
                </div>
                <div className="profile-meta-item">
                  <HiOutlineMail className="meta-icon" />
                  <span>{user?.email || "Login Email"}</span>
                  {user?.email && <HiOutlineCheckCircle className="check-verified" />}
                </div>
                <div className="profile-meta-item">
                  <HiOutlineMail className="meta-icon" style={{ color: "#10b981" }} />
                  <span style={{ color: workEmail ? "inherit" : "#9ca3af", fontStyle: workEmail ? "normal" : "italic" }}>
                    {workEmail || "Add Work Email (for notifications)"}
                  </span>
                  {workEmail && <HiOutlineCheckCircle className="check-verified" style={{ color: "#10b981" }} />}
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
              <li onClick={() => handleQuickLinkClick("section-resume", "resume")}>
                <span>Resume</span>
                <span className="link-action text-blue">Upload</span>
              </li>
              <li onClick={() => handleQuickLinkClick("section-skills", "keySkills")}>
                <span>Key skills</span>
                <span className="link-action text-blue">Add</span>
              </li>
              <li onClick={() => handleQuickLinkClick("section-education", "education")}>
                <span>Education</span>
                <span className="link-action text-blue">Add</span>
              </li>
              <li onClick={() => handleQuickLinkClick("section-itskills", "itSkills")}>
                <span>IT skills</span>
                <span className="link-action text-blue">Add</span>
              </li>
              <li onClick={() => handleQuickLinkClick("section-projects", "projects")}>
                <span>Projects</span>
                <span className="link-action text-blue">Add</span>
              </li>
              <li onClick={() => handleQuickLinkClick("section-summary", "profileSummary")}>
                <span>Profile summary</span>
                <span className="link-action text-blue">Add</span>
              </li>
              <li onClick={() => handleQuickLinkClick("section-personal", "personalDetails")}>
                <span>Personal details</span>
                <span className="link-action text-blue">Add</span>
              </li>
            </ul>
          </div>

          {/* RIGHT COLUMN: PROFILE SECTIONS */}
          <div className="profile-main-content">
            {/* Diversity & Inclusion Survey Card */}
            <div className="profile-section-card diversity-card">
              <div className="diversity-badge">Diversity & inclusion</div>
              <h3>Companies want to build inclusive teams, help us identify your disability status for better jobs.</h3>
              <div className="diversity-options-row">
                <button
                  type="button"
                  className={`diversity-chip ${
                    disabilityStatus === "I have a disability" ? "selected" : ""
                  }`}
                  onClick={() => setDisabilityStatus("I have a disability")}
                >
                  I have a disability
                </button>
                <button
                  type="button"
                  className={`diversity-chip ${
                    disabilityStatus === "I don't have a disability" ? "selected" : ""
                  }`}
                  onClick={() => setDisabilityStatus("I don't have a disability")}
                >
                  I don't have a disability
                </button>
              </div>
              <button
                className="diversity-submit-btn"
                onClick={() => {
                  setDisabilitySubmitted(true);
                  toast.success("Disability status updated!");
                }}
              >
                {disabilitySubmitted ? "Saved ✓" : "Submit"}
              </button>
            </div>

            {/* Resume Section */}
            <div id="section-resume" className="profile-section-card">
              <div className="section-card-header">
                <h3>Resume</h3>
                {resumeData?.url && (
                  <button
                    className="section-edit-btn"
                    onClick={() => resumeInputRef.current && resumeInputRef.current.click()}
                    disabled={uploadingResume}
                  >
                    <HiOutlineRefresh /> Update Resume
                  </button>
                )}
              </div>
              <p className="section-subtext">70% of recruiters discover candidates through their resume</p>

              {/* Hidden file input */}
              <input
                ref={resumeInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.rtf,image/*"
                style={{ display: "none" }}
                onChange={handleResumeUpload}
              />

              {uploadingResume ? (
                <div className="resume-upload-dropzone">
                  <div className="profile-avatar-spinner" style={{ borderColor: "rgba(99, 102, 241, 0.2)", borderTopColor: "#4f46e5" }} />
                  <p style={{ fontWeight: 600, color: "#4f46e5", margin: "8px 0 0 0" }}>Uploading & saving resume to profile...</p>
                </div>
              ) : resumeData?.url || resumeData?.name ? (
                <div className="resume-attached-card">
                  <div className="resume-attached-left">
                    <div className="resume-file-icon">
                      <FaFilePdf />
                    </div>
                    <div className="resume-file-info">
                      <a
                        href={resumeData.url}
                        target="_blank"
                        rel="noreferrer"
                        className="resume-file-name"
                        title="Click to view/download resume"
                      >
                        📄 {resumeData.name || "Resume Document"}
                      </a>
                      <span className="resume-file-date">
                        Uploaded: {resumeData.uploadedAt ? new Date(resumeData.uploadedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "Attached"}
                      </span>
                    </div>
                  </div>
                  <div className="resume-attached-actions">
                    {resumeData.url && (
                      <a
                        href={resumeData.url}
                        target="_blank"
                        rel="noreferrer"
                        className="resume-action-btn view"
                        title="View Resume"
                      >
                        <HiOutlineExternalLink /> View
                      </a>
                    )}
                    <button
                      type="button"
                      className="resume-action-btn update"
                      onClick={() => resumeInputRef.current && resumeInputRef.current.click()}
                      title="Update with a new file"
                    >
                      <HiOutlineRefresh /> Replace
                    </button>
                    <button
                      type="button"
                      className="resume-action-btn delete"
                      onClick={handleDeleteResume}
                      title="Delete Resume"
                    >
                      <HiOutlineTrash /> Remove
                    </button>
                  </div>
                </div>
              ) : (
                /* Upload Dropzone Box */
                <div className="resume-upload-dropzone">
                  <HiOutlineCloudUpload className="upload-cloud-icon" />
                  <p>
                    Already have a resume?{" "}
                    <label
                      className="upload-link-label"
                      onClick={() => resumeInputRef.current && resumeInputRef.current.click()}
                    >
                      Upload resume
                    </label>
                  </p>
                  <span className="dropzone-formats">Supported Formats: doc, docx, rtf, pdf, png, jpeg up to 5MB</span>
                </div>
              )}
            </div>

            {/* Key Skills Section */}
            <div id="section-skills" className="profile-section-card">
              <div className="section-card-header">
                <h3>Key skills</h3>
                <button className="section-edit-btn" onClick={() => setActiveModal("keySkills")}>
                  + Add Key Skills
                </button>
              </div>
              {keySkills.length === 0 ? (
                <p className="empty-section-text">No key skills added yet. Click "+ Add Key Skills" above.</p>
              ) : (
                <div className="skills-tags-row">
                  {keySkills.map((sk) => (
                    <span key={sk} className="profile-skill-chip-deletable">
                      {sk}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(sk)}
                        title="Remove skill"
                        className="chip-remove-btn"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Education Section */}
            <div id="section-education" className="profile-section-card">
              <div className="section-card-header">
                <h3>Education</h3>
                <button className="section-edit-btn" onClick={handleOpenAddEducation}>
                  + Add Education
                </button>
              </div>
              {educationList.length === 0 ? (
                <p className="empty-section-text">No education details added yet. Click "+ Add Education" above.</p>
              ) : (
                educationList.map((edu, idx) => (
                  <div key={idx} className="profile-detail-item">
                    <div className="item-title-row">
                      <h4>
                        {edu.degree} {edu.course && `— ${edu.course}`}
                      </h4>
                      <div className="item-action-btns">
                        <button
                          className="item-icon-btn edit"
                          onClick={() => handleOpenEditEducation(idx)}
                          title="Edit Education"
                        >
                          <HiOutlinePencil />
                        </button>
                        <button
                          className="item-icon-btn delete"
                          onClick={() => handleRemoveEducation(idx)}
                          title="Delete Education"
                        >
                          <HiOutlineTrash />
                        </button>
                      </div>
                    </div>
                    <p className="institute-text">🏛️ {edu.institute}</p>
                    <p className="detail-meta">
                      {edu.specialization} • {edu.courseType} • {edu.startYear} - {edu.endYear}{" "}
                      {edu.grade && `• ${edu.grade}`}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* IT Skills Section */}
            <div id="section-itskills" className="profile-section-card">
              <div className="section-card-header">
                <h3>IT skills</h3>
                <button className="section-edit-btn" onClick={handleOpenAddItSkill}>
                  + Add IT Skills
                </button>
              </div>
              {itSkillsList.length === 0 ? (
                <p className="empty-section-text">No IT skills added yet. Click "+ Add IT Skills" above.</p>
              ) : (
                <div className="it-skills-table">
                  {itSkillsList.map((item, idx) => (
                    <div key={idx} className="it-skill-row">
                      <span className="it-skill-name">{item.name}</span>
                      <span className="it-skill-version">{item.version ? `Ver. ${item.version}` : "-"}</span>
                      <span className="it-skill-exp">
                        {item.expYears} yrs {item.expMonths} mos
                      </span>
                      <span className="it-skill-lastused">Last used: {item.lastUsed}</span>
                      <div className="row-actions">
                        <button
                          className="item-icon-btn edit"
                          onClick={() => handleOpenEditItSkill(idx)}
                          title="Edit IT Skill"
                        >
                          <HiOutlinePencil />
                        </button>
                        <button
                          className="item-icon-btn delete"
                          onClick={() => handleRemoveItSkill(idx)}
                          title="Delete IT Skill"
                        >
                          <HiOutlineTrash />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Projects Section */}
            <div id="section-projects" className="profile-section-card">
              <div className="section-card-header">
                <h3>Projects</h3>
                <button className="section-edit-btn" onClick={handleOpenAddProject}>
                  + Add Project
                </button>
              </div>
              {projectsList.length === 0 ? (
                <p className="empty-section-text">No projects added yet. Click "+ Add Project" above.</p>
              ) : (
                projectsList.map((proj, idx) => (
                  <div key={idx} className="profile-detail-item">
                    <div className="item-title-row">
                      <h4>{proj.title}</h4>
                      <div className="item-action-btns">
                        <button
                          className="item-icon-btn edit"
                          onClick={() => handleOpenEditProject(idx)}
                          title="Edit Project"
                        >
                          <HiOutlinePencil />
                        </button>
                        <button
                          className="item-icon-btn delete"
                          onClick={() => handleRemoveProject(idx)}
                          title="Delete Project"
                        >
                          <HiOutlineTrash />
                        </button>
                      </div>
                    </div>
                    <p className="institute-text">Client: {proj.client}</p>
                    <p className="detail-meta">
                      Status: {proj.status} • Worked: {proj.month} {proj.year}
                    </p>
                    {proj.details && <p className="proj-details-text">{proj.details}</p>}
                  </div>
                ))
              )}
            </div>

            {/* Profile Summary Section */}
            <div id="section-summary" className="profile-section-card">
              <div className="section-card-header">
                <h3>Profile summary</h3>
                <button className="section-edit-btn" onClick={() => setActiveModal("profileSummary")}>
                  <HiOutlinePencil /> Edit
                </button>
              </div>
              {profileSummary ? (
                <p className="summary-paragraph">{profileSummary}</p>
              ) : (
                <p className="empty-section-text">No profile summary added yet. Click Edit to add one.</p>
              )}
            </div>

            {/* Personal Details Section */}
            <div id="section-personal" className="profile-section-card">
              <div className="section-card-header">
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <h3>Personal details</h3>
                  <button
                    className="edit-icon-btn"
                    onClick={() => setActiveModal("personalDetails")}
                    title="Edit personal details"
                  >
                    <HiOutlinePencil />
                  </button>
                </div>
              </div>
              <p className="section-subtext">This information is important for employers to know you better</p>

              <div className="personal-details-grid">
                <div className="personal-detail-box" onClick={() => setActiveModal("personalDetails")}>
                  <span className="personal-detail-label">Personal</span>
                  <span className="personal-detail-value blue-link-text">
                    {personalDetails.gender || personalDetails.maritalStatus
                      ? `${personalDetails.gender || "Gender"}, ${personalDetails.maritalStatus || "Marital Status"}`
                      : "Add gender, marital status, more info"}
                  </span>
                </div>

                <div className="personal-detail-box" onClick={() => setActiveModal("personalDetails")}>
                  <span className="personal-detail-label">Work permit</span>
                  <span className="personal-detail-value blue-link-text">
                    {personalDetails.workPermit || "Add Work permit"}
                  </span>
                </div>

                <div className="personal-detail-box" onClick={() => setActiveModal("personalDetails")}>
                  <span className="personal-detail-label">Date of birth</span>
                  <span className="personal-detail-value blue-link-text">
                    {personalDetails.dob || "Add Date of birth"}
                  </span>
                </div>

                <div className="personal-detail-box" onClick={() => setActiveModal("personalDetails")}>
                  <span className="personal-detail-label">Address</span>
                  <span className="personal-detail-value blue-link-text">
                    {personalDetails.address || "Add Address"}
                  </span>
                </div>

                <div className="personal-detail-box" onClick={() => setActiveModal("personalDetails")}>
                  <span className="personal-detail-label">Category</span>
                  <span className="personal-detail-value blue-link-text">
                    {personalDetails.category || "Add Category"}
                  </span>
                </div>

                <div className="personal-detail-box" onClick={() => setActiveModal("personalDetails")}>
                  <span className="personal-detail-label">Languages</span>
                  <span className="personal-detail-value blue-link-text">
                    {personalDetails.languages || "Add languages"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* INTERACTIVE MODALS                                                       */}
      {/* ========================================================================= */}

      {/* 0. HEADER INFO MODAL (Edit Location, Phone, Email) */}
      {activeModal === "headerInfo" && (
        <div className="profile-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="profile-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <h2>Contact & Location Info</h2>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}>
                <HiX />
              </button>
            </div>
            <p className="modal-subtext">Update your primary location and contact information.</p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                persistUserData({ location, workEmail });
                setActiveModal(null);
                toast.success("Contact & Location info updated!");
              }}
            >
              <div className="modal-form-group">
                <label>Location</label>
                <input
                  type="text"
                  className="modal-input"
                  placeholder="e.g. Ahmedabad, INDIA"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              <div className="modal-form-group">
                <label>Phone Number</label>
                <input
                  type="text"
                  className="modal-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="modal-form-group">
                <label>
                  Account Email
                  <span style={{ color: "#9ca3af", fontSize: "11px", fontWeight: 400, marginLeft: "6px" }}>
                    (login email — read‑only)
                  </span>
                </label>
                <input
                  type="email"
                  className="modal-input"
                  value={user?.email || ""}
                  readOnly
                  style={{ background: "#f3f4f6", color: "#6b7280", cursor: "not-allowed" }}
                />
              </div>
              <div className="modal-form-group">
                <label>
                  Work Email
                  <span style={{ color: "#9ca3af", fontSize: "11px", fontWeight: 400, marginLeft: "6px" }}>
                    (application & notification emails go here)
                  </span>
                </label>
                <input
                  type="email"
                  className="modal-input"
                  placeholder="e.g. yourname@company.com"
                  value={workEmail}
                  onChange={(e) => setWorkEmail(e.target.value)}
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

      {/* 1. KEY SKILLS MODAL */}
      {activeModal === "keySkills" && (
        <div className="profile-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="profile-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <h2>Key skills</h2>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}>
                <HiX />
              </button>
            </div>
            <p className="modal-subtext">
              Add skills that best define your expertise, for e.g. Direct Marketing, Oracle, Java, etc. (Minimum 1)
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (tempSkillInput) {
                  handleAddSkill(tempSkillInput);
                  setTempSkillInput("");
                }
              }}
            >
              <div className="modal-form-group">
                <label>Skills</label>
                <div className="input-with-chips-box">
                  <div className="added-skills-row">
                    {keySkills.map((sk) => (
                      <span key={sk} className="modal-skill-tag">
                        {sk}
                        <button type="button" onClick={() => handleRemoveSkill(sk)}>
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Add skills"
                    value={tempSkillInput}
                    onChange={(e) => setTempSkillInput(e.target.value)}
                  />
                </div>
              </div>

              <div className="suggested-skills-block">
                <label className="suggested-label">Or you can select from the suggested set of skills</label>
                <div className="suggested-pills-wrap">
                  {suggestedSkills.map((sug) => {
                    const isAdded = keySkills.includes(sug);
                    return (
                      <button
                        type="button"
                        key={sug}
                        className={`suggested-skill-btn ${isAdded ? "added" : ""}`}
                        onClick={() => !isAdded && handleAddSkill(sug)}
                      >
                        {sug} {isAdded ? "✓" : "+"}
                      </button>
                    );
                  })}
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

      {/* 2. EDUCATION MODAL (Add & Edit) */}
      {activeModal === "education" && (
        <div className="profile-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="profile-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <h2>{editingEduIndex !== null ? "Edit Education" : "Add Education"}</h2>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}>
                <HiX />
              </button>
            </div>
            <p className="modal-subtext">
              Details like course, university, and more, help recruiters identify your educational background
            </p>

            <form onSubmit={handleSaveEducation}>
              <div className="modal-form-group">
                <label>Education *</label>
                <select
                  className="modal-select"
                  value={tempEdu.degree}
                  onChange={(e) => setTempEdu({ ...tempEdu, degree: e.target.value })}
                  required
                >
                  <option value="Masters/Post-Graduation">Masters/Post-Graduation</option>
                  <option value="Graduation/Bachelor's">Graduation/Bachelor's</option>
                  <option value="Doctorate/Ph.D">Doctorate/Ph.D</option>
                  <option value="Diploma">Diploma</option>
                </select>
              </div>

              <div className="modal-form-group">
                <label>University/Institute *</label>
                <input
                  type="text"
                  className="modal-input"
                  placeholder="Select university/institute"
                  value={tempEdu.institute}
                  onChange={(e) => setTempEdu({ ...tempEdu, institute: e.target.value })}
                  required
                />
              </div>

              <div className="modal-form-group">
                <label>Course *</label>
                <select
                  className="modal-select"
                  value={tempEdu.course}
                  onChange={(e) => setTempEdu({ ...tempEdu, course: e.target.value })}
                  required
                >
                  <option value="MCA">MCA</option>
                  <option value="B.Tech">B.Tech</option>
                  <option value="B.Sc">B.Sc</option>
                  <option value="MBA">MBA</option>
                  <option value="BCA">BCA</option>
                </select>
              </div>

              <div className="modal-form-group">
                <label>Specialization *</label>
                <input
                  type="text"
                  className="modal-input"
                  placeholder="Select specialization"
                  value={tempEdu.specialization}
                  onChange={(e) => setTempEdu({ ...tempEdu, specialization: e.target.value })}
                  required
                />
              </div>

              <div className="modal-form-group">
                <label>Course type *</label>
                <div className="radio-options-row">
                  {["Full time", "Part time", "Correspondence/Distance learning"].map((ct) => (
                    <label key={ct} className="radio-label">
                      <input
                        type="radio"
                        name="courseType"
                        checked={tempEdu.courseType === ct}
                        onChange={() => setTempEdu({ ...tempEdu, courseType: ct })}
                      />
                      <span>{ct}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="modal-form-group">
                <label>Course duration *</label>
                <div className="grid-2-col">
                  <select
                    className="modal-select"
                    value={tempEdu.startYear}
                    onChange={(e) => setTempEdu({ ...tempEdu, startYear: e.target.value })}
                  >
                    <option value="2022">2022</option>
                    <option value="2023">2023</option>
                    <option value="2024">2024</option>
                  </select>
                  <select
                    className="modal-select"
                    value={tempEdu.endYear}
                    onChange={(e) => setTempEdu({ ...tempEdu, endYear: e.target.value })}
                  >
                    <option value="2026">2026</option>
                    <option value="2027">2027</option>
                    <option value="2028">2028</option>
                  </select>
                </div>
              </div>

              <div className="modal-form-group">
                <label>Grading system</label>
                <select
                  className="modal-select"
                  value={tempEdu.gradingSystem}
                  onChange={(e) => setTempEdu({ ...tempEdu, gradingSystem: e.target.value })}
                >
                  <option value="Scale 10 Grading System">Scale 10 Grading System</option>
                  <option value="Scale 4 Grading System">Scale 4 Grading System</option>
                  <option value="% Marks of 100 Maximum">% Marks of 100 Maximum</option>
                </select>
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

      {/* 3. IT SKILLS MODAL (Add & Edit) */}
      {activeModal === "itSkills" && (
        <div className="profile-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="profile-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <h2>{editingItSkillIndex !== null ? "Edit IT Skill" : "Add IT Skill"}</h2>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}>
                <HiX />
              </button>
            </div>
            <p className="modal-subtext">
              Mention skills like programming languages (Java, Python), softwares (Microsoft Word, Excel) and more, to show your technical expertise.
            </p>

            <form onSubmit={handleSaveItSkill}>
              <div className="modal-form-group">
                <label>Skill / software name *</label>
                <input
                  type="text"
                  className="modal-input"
                  placeholder="Skill / Software name"
                  value={tempItSkill.name}
                  onChange={(e) => setTempItSkill({ ...tempItSkill, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid-2-col">
                <div className="modal-form-group">
                  <label>Software version</label>
                  <input
                    type="text"
                    className="modal-input"
                    placeholder="Software version"
                    value={tempItSkill.version}
                    onChange={(e) => setTempItSkill({ ...tempItSkill, version: e.target.value })}
                  />
                </div>
                <div className="modal-form-group">
                  <label>Last used</label>
                  <select
                    className="modal-select"
                    value={tempItSkill.lastUsed}
                    onChange={(e) => setTempItSkill({ ...tempItSkill, lastUsed: e.target.value })}
                  >
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                    <option value="2024">2024</option>
                  </select>
                </div>
              </div>

              <div className="modal-form-group">
                <label>Experience</label>
                <div className="grid-2-col">
                  <select
                    className="modal-select"
                    value={tempItSkill.expYears}
                    onChange={(e) => setTempItSkill({ ...tempItSkill, expYears: e.target.value })}
                  >
                    <option value="0">0 Years</option>
                    <option value="1">1 Year</option>
                    <option value="2">2 Years</option>
                    <option value="3">3 Years</option>
                  </select>
                  <select
                    className="modal-select"
                    value={tempItSkill.expMonths}
                    onChange={(e) => setTempItSkill({ ...tempItSkill, expMonths: e.target.value })}
                  >
                    <option value="0">0 Months</option>
                    <option value="3">3 Months</option>
                    <option value="6">6 Months</option>
                  </select>
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

      {/* 4. PROJECTS MODAL (Add & Edit) */}
      {activeModal === "projects" && (
        <div className="profile-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="profile-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <h2>{editingProjectIndex !== null ? "Edit Project" : "Add Project"}</h2>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}>
                <HiX />
              </button>
            </div>
            <p className="modal-subtext">
              Stand out for employers by adding details about projects you have done in college, internships, or at work
            </p>

            <form onSubmit={handleSaveProject}>
              <div className="modal-form-group">
                <label>Project title *</label>
                <input
                  type="text"
                  className="modal-input"
                  placeholder="Enter project title"
                  value={tempProject.title}
                  onChange={(e) => setTempProject({ ...tempProject, title: e.target.value })}
                  required
                />
              </div>

              <div className="modal-form-group">
                <label>Client *</label>
                <input
                  type="text"
                  className="modal-input"
                  placeholder="Enter client name"
                  value={tempProject.client}
                  onChange={(e) => setTempProject({ ...tempProject, client: e.target.value })}
                  required
                />
              </div>

              <div className="modal-form-group">
                <label>Project status</label>
                <div className="radio-options-row">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="projStatus"
                      checked={tempProject.status === "In progress"}
                      onChange={() => setTempProject({ ...tempProject, status: "In progress" })}
                    />
                    <span>In progress</span>
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="projStatus"
                      checked={tempProject.status === "Finished"}
                      onChange={() => setTempProject({ ...tempProject, status: "Finished" })}
                    />
                    <span>Finished</span>
                  </label>
                </div>
              </div>

              <div className="modal-form-group">
                <label>Worked from *</label>
                <div className="grid-2-col">
                  <select
                    className="modal-select"
                    value={tempProject.year}
                    onChange={(e) => setTempProject({ ...tempProject, year: e.target.value })}
                  >
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                  </select>
                  <select
                    className="modal-select"
                    value={tempProject.month}
                    onChange={(e) => setTempProject({ ...tempProject, month: e.target.value })}
                  >
                    <option value="August">August</option>
                    <option value="July">July</option>
                    <option value="June">June</option>
                  </select>
                </div>
              </div>

              <div className="modal-form-group">
                <label>Details of project *</label>
                <textarea
                  className="modal-textarea"
                  placeholder="Type here..."
                  rows={4}
                  maxLength={1000}
                  value={tempProject.details}
                  onChange={(e) => setTempProject({ ...tempProject, details: e.target.value })}
                  required
                />
                <span className="char-count">{1000 - tempProject.details.length} character(s) left</span>
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

      {/* 5. PROFILE SUMMARY MODAL */}
      {activeModal === "profileSummary" && (
        <div className="profile-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="profile-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <h2>Profile summary</h2>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}>
                <HiX />
              </button>
            </div>
            <p className="modal-subtext">
              Highlight your key accomplishments, technical domain expertise, and career aspirations.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                persistUserData({ profileSummary });
                setActiveModal(null);
                toast.success("Profile summary saved!");
              }}
            >
              <div className="modal-form-group">
                <label>Profile Summary</label>
                <textarea
                  className="modal-textarea"
                  rows={5}
                  value={profileSummary}
                  onChange={(e) => setProfileSummary(e.target.value)}
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

      {/* 6. PERSONAL DETAILS MODAL */}
      {activeModal === "personalDetails" && (
        <div className="profile-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="profile-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <h2>Personal details</h2>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}>
                <HiX />
              </button>
            </div>
            <p className="modal-subtext">
              This information is important for employers to know you better.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const toSave = {
                  ...personalDetails,
                  gender: personalDetails.gender || "Male",
                  maritalStatus: personalDetails.maritalStatus || "Single",
                  category: personalDetails.category || "General",
                };
                setPersonalDetails(toSave);
                persistUserData({ personalDetails: toSave });
                setActiveModal(null);
                toast.success("Personal details updated!");
              }}
            >
              <div className="grid-2-col">
                <div className="modal-form-group">
                  <label>Gender</label>
                  <select
                    className="modal-select"
                    value={personalDetails.gender || "Male"}
                    onChange={(e) => setPersonalDetails({ ...personalDetails, gender: e.target.value })}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="modal-form-group">
                  <label>Marital Status</label>
                  <select
                    className="modal-select"
                    value={personalDetails.maritalStatus || "Single"}
                    onChange={(e) => setPersonalDetails({ ...personalDetails, maritalStatus: e.target.value })}
                  >
                    <option value="Single">Single / Unmarried</option>
                    <option value="Married">Married</option>
                  </select>
                </div>
              </div>

              <div className="grid-2-col">
                <div className="modal-form-group">
                  <label>Date of birth</label>
                  <input
                    type="text"
                    className="modal-input"
                    placeholder="e.g. 15 May 2001"
                    value={personalDetails.dob || ""}
                    onChange={(e) => setPersonalDetails({ ...personalDetails, dob: e.target.value })}
                  />
                </div>
                <div className="modal-form-group">
                  <label>Work permit</label>
                  <input
                    type="text"
                    className="modal-input"
                    placeholder="e.g. Have INDIA work permit"
                    value={personalDetails.workPermit || ""}
                    onChange={(e) => setPersonalDetails({ ...personalDetails, workPermit: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-form-group">
                <label>Address</label>
                <input
                  type="text"
                  className="modal-input"
                  placeholder="Enter current address"
                  value={personalDetails.address || ""}
                  onChange={(e) => setPersonalDetails({ ...personalDetails, address: e.target.value })}
                />
              </div>

              <div className="grid-2-col">
                <div className="modal-form-group">
                  <label>Category</label>
                  <select
                    className="modal-select"
                    value={personalDetails.category || "General"}
                    onChange={(e) => setPersonalDetails({ ...personalDetails, category: e.target.value })}
                  >
                    <option value="General">General</option>
                    <option value="OBC">OBC</option>
                    <option value="SC/ST">SC/ST</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="modal-form-group">
                  <label>Languages</label>
                  <input
                    type="text"
                    className="modal-input"
                    placeholder="e.g. English, Hindi, Gujarati"
                    value={personalDetails.languages || ""}
                    onChange={(e) => setPersonalDetails({ ...personalDetails, languages: e.target.value })}
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
    </section>
  );
};

export default JobseekerProfile;
