import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1";

// ─── High Performance In-Memory Cache Layer ─────────────────────────────────
const memoryCache = new Map();

const getCached = (key, ttlMs = 15000) => {
  const item = memoryCache.get(key);
  if (!item) return null;
  if (Date.now() - item.timestamp > ttlMs) {
    memoryCache.delete(key);
    return null;
  }
  return item.data;
};

const setCached = (key, data) => {
  memoryCache.set(key, { data, timestamp: Date.now() });
};

export const clearCache = (prefix = "") => {
  if (!prefix) {
    memoryCache.clear();
  } else {
    for (const key of memoryCache.keys()) {
      if (key.startsWith(prefix)) memoryCache.delete(key);
    }
  }
};

// ─── Jobs ───────────────────────────────────────────────────────────────────

export const fetchAllJobs = async (forceRefresh = false) => {
  const cacheKey = "all_jobs";
  if (!forceRefresh) {
    const cached = getCached(cacheKey, 20000);
    if (cached) return cached;
  }
  try {
    const { data } = await axios.get(`${API_URL}/job/getall`, {
      withCredentials: true,
    });
    const result = { jobs: data.jobs, offline: false };
    setCached(cacheKey, result);
    return result;
  } catch (error) {
    console.error("fetchAllJobs error:", error);
    return { jobs: [], offline: true };
  }
};

export const fetchJobById = async (id) => {
  const cacheKey = `job_${id}`;
  const cached = getCached(cacheKey, 30000);
  if (cached) return cached;
  try {
    const { data } = await axios.get(`${API_URL}/job/${id}`, {
      withCredentials: true,
    });
    const result = { job: data.job, offline: false };
    setCached(cacheKey, result);
    return result;
  } catch (error) {
    console.error("fetchJobById error:", error);
    return { job: null, offline: true };
  }
};

export const fetchMyJobs = async () => {
  try {
    const { data } = await axios.get(`${API_URL}/job/getmyjobs`, {
      withCredentials: true,
    });
    return { myJobs: data.myJobs, offline: false };
  } catch (error) {
    console.error("fetchMyJobs error:", error);
    return { myJobs: [], offline: true };
  }
};

export const updateJob = async (jobId, updatedJob) => {
  clearCache("all_jobs");
  clearCache(`job_${jobId}`);
  try {
    const { data } = await axios.put(`${API_URL}/job/update/${jobId}`, updatedJob, {
      withCredentials: true,
    });
    return { message: data.message, offline: false };
  } catch (error) {
    console.error("updateJob error:", error);
    return { message: "Cannot update job in offline mode.", offline: true };
  }
};

export const deleteJob = async (jobId) => {
  clearCache("all_jobs");
  clearCache(`job_${jobId}`);
  try {
    const { data } = await axios.delete(`${API_URL}/job/delete/${jobId}`, {
      withCredentials: true,
    });
    return { message: data.message, offline: false };
  } catch (error) {
    console.error("deleteJob error:", error);
    return { message: "Cannot delete job in offline mode.", offline: true };
  }
};

// ─── Wishlist ────────────────────────────────────────────────────────────────

export const fetchWishlist = async (force = false) => {
  const cacheKey = "user_wishlist";
  if (!force) {
    const cached = getCached(cacheKey, 15000);
    if (cached) return cached;
  }
  try {
    const { data } = await axios.get(`${API_URL}/wishlist`, {
      withCredentials: true,
    });
    const result = { wishlist: data.wishlist, offline: false };
    setCached(cacheKey, result);
    return result;
  } catch (error) {
    console.error("fetchWishlist error:", error);
    return { wishlist: [], offline: true };
  }
};

export const toggleWishlist = async (jobId) => {
  clearCache("user_wishlist");
  const { data } = await axios.post(
    `${API_URL}/wishlist/toggle/${jobId}`,
    {},
    { withCredentials: true }
  );
  // Returns { success, message, saved }
  return { message: data.message, saved: data.saved };
};

export const checkWishlist = async (jobId) => {
  try {
    const { data } = await axios.get(`${API_URL}/wishlist/check/${jobId}`, {
      withCredentials: true,
    });
    return { saved: data.saved };
  } catch (error) {
    return { saved: false };
  }
};

export const removeFromWishlist = async (jobId) => {
  clearCache("user_wishlist");
  try {
    const { data } = await axios.delete(`${API_URL}/wishlist/${jobId}`, {
      withCredentials: true,
    });
    return { message: data.message };
  } catch (error) {
    throw error;
  }
};

// ─── Company Profile ─────────────────────────────────────────────────────────

export const fetchCompanyProfile = async () => {
  try {
    const { data } = await axios.get(`${API_URL}/user/company`, {
      withCredentials: true,
    });
    return { company: data.company, offline: false };
  } catch (error) {
    console.error("fetchCompanyProfile error:", error);
    return { company: {}, offline: true };
  }
};

export const updateCompanyProfile = async (companyData) => {
  const { data } = await axios.put(`${API_URL}/user/company`, companyData, {
    withCredentials: true,
  });
  return { message: data.message, company: data.company };
};

export const fetchEmployerProfile = async (id) => {
  try {
    const { data } = await axios.get(`${API_URL}/user/employer/${id}`, {
      withCredentials: true,
    });
    return { employer: data.employer, jobs: data.jobs, offline: false };
  } catch (error) {
    console.error("fetchEmployerProfile error:", error);
    return { employer: null, jobs: [], offline: true };
  }
};

// ─── Applications ────────────────────────────────────────────────────────────

export const fetchApplications = async (role) => {
  try {
    const endpoint =
      role === "Employer"
        ? `${API_URL}/application/employer/getall`
        : `${API_URL}/application/jobseeker/getall`;

    const { data } = await axios.get(endpoint, { withCredentials: true });
    return { applications: data.applications, offline: false };
  } catch (error) {
    console.error("fetchApplications error:", error);
    return { applications: [], offline: true };
  }
};

export const deleteApplication = async (id) => {
  try {
    const { data } = await axios.delete(`${API_URL}/application/delete/${id}`, {
      withCredentials: true,
    });
    return { message: data.message, offline: false };
  } catch (error) {
    console.error("deleteApplication error:", error);
    return { message: "Cannot delete in offline mode.", offline: true };
  }
};

export const updateApplicationStatus = async (id, status) => {
  try {
    const { data } = await axios.patch(
      `${API_URL}/application/status/${id}`,
      { status },
      { withCredentials: true }
    );
    return { message: data.message, application: data.application, offline: false };
  } catch (error) {
    console.error("updateApplicationStatus error:", error);
    const msg = error.response?.data?.message || "Failed to update application status.";
    return { message: msg, offline: true };
  }
};

// ─── MongoDB Atlas Separate Collections Helpers ─────────────────────────────

export const fetchJobseekerProfile = async (force = false) => {
  const cacheKey = "jobseeker_full_profile";
  if (!force) {
    const cached = getCached(cacheKey, 20000);
    if (cached) return cached;
  }
  try {
    const { data } = await axios.get(`${API_URL}/user/jobseeker/profile`, {
      withCredentials: true,
    });
    const result = { profile: data.profile, offline: false };
    setCached(cacheKey, result);
    return result;
  } catch (error) {
    console.error("fetchJobseekerProfile error:", error);
    return { profile: null, offline: true };
  }
};

export const updateJobseekerProfileApi = async (profileData) => {
  clearCache("jobseeker_full_profile");
  try {
    const { data } = await axios.put(`${API_URL}/user/jobseeker/profile`, profileData, {
      withCredentials: true,
    });
    return { message: data.message, profile: data.profile, offline: false };
  } catch (error) {
    console.error("updateJobseekerProfileApi error:", error);
    return { message: "Failed to update profile", offline: true };
  }
};

export const fetchJobseekerProfileByUserId = async (userId) => {
  try {
    const { data } = await axios.get(`${API_URL}/user/jobseeker/profile/${userId}`, {
      withCredentials: true,
    });
    return { profile: data.profile, offline: false };
  } catch (error) {
    console.error("fetchJobseekerProfileByUserId error:", error);
    return { profile: null, offline: true };
  }
};

export const fetchEmployerFullProfile = async (force = false) => {
  const cacheKey = "employer_full_profile";
  if (!force) {
    const cached = getCached(cacheKey, 20000);
    if (cached) return cached;
  }
  try {
    const { data } = await axios.get(`${API_URL}/user/employer/full-profile`, {
      withCredentials: true,
    });
    const result = { profile: data.profile, offline: false };
    setCached(cacheKey, result);
    return result;
  } catch (error) {
    console.error("fetchEmployerFullProfile error:", error);
    return { profile: null, offline: true };
  }
};

export const updateEmployerFullProfileApi = async (profileData) => {
  clearCache("employer_full_profile");
  try {
    const { data } = await axios.put(`${API_URL}/user/employer/full-profile`, profileData, {
      withCredentials: true,
    });
    return { message: data.message, profile: data.profile, offline: false };
  } catch (error) {
    console.error("updateEmployerFullProfileApi error:", error);
    return { message: "Failed to update employer profile", offline: true };
  }
};

export const fetchNotificationsApi = async () => {
  try {
    const { data } = await axios.get(`${API_URL}/user/notifications`, {
      withCredentials: true,
    });
    return { notifications: data.notifications || [], offline: false };
  } catch (error) {
    console.error("fetchNotificationsApi error:", error);
    return { notifications: [], offline: true };
  }
};

export const markNotificationsReadApi = async () => {
  try {
    const { data } = await axios.put(`${API_URL}/user/notifications/mark-read`, {}, {
      withCredentials: true,
    });
    return { message: data.message, offline: false };
  } catch (error) {
    console.error("markNotificationsReadApi error:", error);
    return { message: "Failed to mark as read", offline: true };
  }
};

export const markSingleNotificationReadApi = async (id) => {
  try {
    const { data } = await axios.put(`${API_URL}/user/notifications/mark-read/${id}`, {}, {
      withCredentials: true,
    });
    return { message: data.message, offline: false };
  } catch (error) {
    console.error("markSingleNotificationReadApi error:", error);
    return { message: "Failed to mark as read", offline: true };
  }
};

export const resetPasswordApi = async (resetData) => {
  try {
    const { data } = await axios.post(`${API_URL}/user/reset-password`, resetData, {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    });
    return { message: data.message, success: true };
  } catch (error) {
    console.error("resetPasswordApi error:", error);
    return {
      message: error.response?.data?.message || "Failed to reset password.",
      success: false,
    };
  }
};

export const uploadProfilePictureApi = async (formData) => {
  try {
    const { data } = await axios.post(`${API_URL}/user/profile-picture`, formData, {
      withCredentials: true,
      headers: { "Content-Type": "multipart/form-data" },
    });
    return { profilePicture: data.profilePicture, message: data.message, success: true };
  } catch (error) {
    const msg = error.response?.data?.message || error.message || "Failed to upload profile picture.";
    console.error("uploadProfilePictureApi error:", msg, error.response?.data);
    return { message: msg, success: false };
  }
};

export const deleteProfilePictureApi = async () => {
  try {
    const { data } = await axios.delete(`${API_URL}/user/profile-picture`, {
      withCredentials: true,
    });
    return { message: data.message, success: true };
  } catch (error) {
    const msg = error.response?.data?.message || error.message || "Failed to delete profile picture.";
    console.error("deleteProfilePictureApi error:", msg, error.response?.data);
    return { message: msg, success: false };
  }
};

export const uploadResumeApi = async (formData) => {
  try {
    const { data } = await axios.post(`${API_URL}/user/resume`, formData, {
      withCredentials: true,
      headers: { "Content-Type": "multipart/form-data" },
    });
    return { resume: data.resume, message: data.message, success: true };
  } catch (error) {
    const msg = error.response?.data?.message || error.message || "Failed to upload resume.";
    console.error("uploadResumeApi error:", msg, error.response?.data);
    return { message: msg, success: false };
  }
};

export const deleteResumeApi = async () => {
  try {
    const { data } = await axios.delete(`${API_URL}/user/resume`, {
      withCredentials: true,
    });
    return { message: data.message, success: true };
  } catch (error) {
    const msg = error.response?.data?.message || error.message || "Failed to delete resume.";
    console.error("deleteResumeApi error:", msg, error.response?.data);
    return { message: msg, success: false };
  }
};



// ─── AI Job Match Recommendations ────────────────────────────────────────────

export const fetchAiMatchRecommendations = async () => {
  try {
    const { data } = await axios.post(
      `${API_URL}/ai/match`,
      {},
      { withCredentials: true }
    );
    return {
      recommendations: data.recommendations || [],
      profileName: data.profileName,
      totalAnalyzed: data.totalAnalyzed,
      candidateSkills: data.candidateSkills || [],
      noSkills: data.noSkills || false,
      offline: false,
    };
  } catch (error) {
    console.error("fetchAiMatchRecommendations error:", error);
    const message =
      error.response?.data?.message ||
      "Failed to fetch AI recommendations. Please try again.";
    throw new Error(message);
  }
};

// ─── Fraud & Dispute Redressal ──────────────────────────────────────────────

export const submitFraudReport = async (formData) => {
  try {
    const { data } = await axios.post(
      `${API_URL}/fraud/report`,
      formData,
      {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return { success: true, message: data.message, report: data.report };
  } catch (error) {
    console.error("submitFraudReport error:", error);
    const msg = error.response?.data?.message || "Failed to submit fraud report.";
    return { success: false, message: msg };
  }
};

export const fetchMyFraudReports = async () => {
  try {
    const { data } = await axios.get(
      `${API_URL}/fraud/my-reports`,
      { withCredentials: true }
    );
    return { success: true, reports: data.reports || [] };
  } catch (error) {
    console.error("fetchMyFraudReports error:", error);
    return { success: false, reports: [] };
  }
};


