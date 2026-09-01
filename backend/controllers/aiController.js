import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/error.js";
import { Jobseeker } from "../models/jobseekerSchema.js";
import { Job } from "../models/jobSchema.js";
import { User } from "../models/userSchema.js";
import { Employer } from "../models/employerSchema.js";
import mongoose from "mongoose";

// Comprehensive Technical & Domain Skills
const KNOWN_SKILLS = [
  "React", "Node.js", "Express", "MongoDB", "JavaScript", "TypeScript", "Python", "Java",
  "C++", "C#", ".NET", "PHP", "Laravel", "Django", "Flask", "FastAPI", "Spring Boot",
  "HTML5", "CSS3", "Tailwind CSS", "Bootstrap", "Next.js", "Vue.js", "Angular",
  "SQL", "PostgreSQL", "MySQL", "Redis", "GraphQL", "REST APIs", "Microservices",
  "Software Architecture", "System Design", "Cloud Infrastructure", "AWS", "Azure", "GCP",
  "Docker", "Kubernetes", "CI/CD", "Git", "DevOps", "Linux", "Agile", "Scrum",
  "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "NLP", "AI Engineering",
  "Data Science", "Pandas", "NumPy", "Power BI", "Tableau", "Data Analysis",
  "Figma", "UI/UX Design", "Adobe XD", "Wireframing", "Prototyping", "User Research",
  "React Native", "Flutter", "iOS", "Android", "Swift", "Kotlin",
  "SEO", "Google Analytics", "Content Strategy", "Digital Marketing"
];

// Helper: Extract actual required skills for a job
const getJobRequiredSkills = (job) => {
  const text = `${job.title || ""} ${job.category || ""} ${job.description || ""}`.toLowerCase();
  const found = [];

  KNOWN_SKILLS.forEach((skill) => {
    const sLower = skill.toLowerCase();
    if (text.includes(sLower) && !found.includes(skill)) {
      found.push(skill);
    }
  });

  // If few skills detected directly in text, provide accurate role skills
  if (found.length < 3) {
    const lowerTitle = (job.title || "").toLowerCase();
    const lowerCat = (job.category || "").toLowerCase();

    if (lowerTitle.includes("architect") || lowerCat.includes("architect")) {
      ["Software Architecture", "System Design", "Microservices", "Cloud Infrastructure"].forEach((s) => {
        if (!found.includes(s)) found.push(s);
      });
    } else if (lowerTitle.includes("ai") || lowerTitle.includes("ml") || lowerCat.includes("ai") || lowerCat.includes("machine")) {
      ["Python", "Machine Learning", "Deep Learning", "AI Engineering"].forEach((s) => {
        if (!found.includes(s)) found.push(s);
      });
    } else if (lowerTitle.includes("mern") || lowerCat.includes("mern") || lowerTitle.includes("full stack")) {
      ["React", "Node.js", "MongoDB", "Express"].forEach((s) => {
        if (!found.includes(s)) found.push(s);
      });
    } else if (lowerTitle.includes("frontend") || lowerCat.includes("frontend") || lowerTitle.includes("web")) {
      ["React", "JavaScript", "HTML5", "CSS3"].forEach((s) => {
        if (!found.includes(s)) found.push(s);
      });
    } else if (lowerTitle.includes("backend") || lowerCat.includes("backend")) {
      ["Node.js", "Python", "SQL", "REST APIs"].forEach((s) => {
        if (!found.includes(s)) found.push(s);
      });
    } else if (lowerTitle.includes("design") || lowerCat.includes("design") || lowerCat.includes("ui") || lowerCat.includes("ux")) {
      ["Figma", "UI/UX Design", "Wireframing", "Prototyping"].forEach((s) => {
        if (!found.includes(s)) found.push(s);
      });
    } else if (lowerTitle.includes("data") || lowerCat.includes("data")) {
      ["SQL", "Python", "Data Analysis", "Power BI"].forEach((s) => {
        if (!found.includes(s)) found.push(s);
      });
    } else if (lowerTitle.includes("mobile") || lowerCat.includes("mobile") || lowerTitle.includes("app")) {
      ["React Native", "Flutter", "Android", "iOS"].forEach((s) => {
        if (!found.includes(s)) found.push(s);
      });
    } else {
      ["Problem Solving", "Agile", "REST APIs", "Git"].forEach((s) => {
        if (!found.includes(s)) found.push(s);
      });
    }
  }

  return found.slice(0, 5);
};

// ─── Smart Local Algorithmic Matcher ─────────────────────────────────────────
const calculateLocalJobMatches = (profile, jobs) => {
  const rawKeySkills = (profile.keySkills || []).map((s) => s.trim()).filter(Boolean);
  const rawItSkills = (profile.itSkillsList || []).map((s) => s.name?.trim()).filter(Boolean);
  const allCandidateSkills = Array.from(new Set([...rawKeySkills, ...rawItSkills]));

  const candidateLocation = (profile.location || "").toLowerCase();
  const educationDegrees = (profile.educationList || []).map((e) => `${e.degree || ""} ${e.course || ""}`.toLowerCase());

  const matches = jobs.map((job) => {
    let score = 52; // base score
    const matchedCandidateSkills = [];
    const jobRequiredSkills = (job.skills && Array.isArray(job.skills) && job.skills.length > 0)
      ? job.skills
      : (typeof job.skills === "string" && job.skills.trim())
      ? job.skills.split(",").map((s) => s.trim()).filter(Boolean)
      : getJobRequiredSkills(job);

    const jobTitle = (job.title || "").toLowerCase();
    const jobCat = (job.category || "").toLowerCase();
    const jobDesc = (job.description || "").toLowerCase();
    const jobCity = (job.city || "").toLowerCase();
    const jobCountry = (job.country || "").toLowerCase();

    // 1. Skill Matching with candidate's actual skills
    allCandidateSkills.forEach((candSkill) => {
      if (!candSkill) return;
      const sLower = candSkill.toLowerCase();
      const isMatch =
        jobRequiredSkills.some((req) => req.toLowerCase() === sLower || req.toLowerCase().includes(sLower) || sLower.includes(req.toLowerCase())) ||
        jobTitle.includes(sLower) ||
        jobCat.includes(sLower) ||
        jobDesc.includes(sLower);

      if (isMatch) {
        score += 15;
        const canonical = KNOWN_SKILLS.find((k) => k.toLowerCase() === sLower) || candSkill;
        if (!matchedCandidateSkills.includes(canonical)) {
          matchedCandidateSkills.push(canonical);
        }
      }
    });

    // 2. Location score bonus
    if (candidateLocation && (jobCity.includes(candidateLocation) || candidateLocation.includes(jobCity) || candidateLocation.includes(jobCountry))) {
      score += 10;
    }

    // 3. Education score bonus
    educationDegrees.forEach((deg) => {
      if (deg && (jobTitle.includes(deg) || jobDesc.includes(deg))) {
        score += 8;
      }
    });

    // Assemble final skills list: Matched skills first, then job required skills
    const finalSkillsList = [];
    matchedCandidateSkills.forEach((s) => {
      if (!finalSkillsList.includes(s)) finalSkillsList.push(s);
    });
    jobRequiredSkills.forEach((s) => {
      if (!finalSkillsList.includes(s) && finalSkillsList.length < 4) {
        finalSkillsList.push(s);
      }
    });

    // Clamp score between 55% and 98%
    const finalScore = Math.min(Math.max(score, 55), 98);

    // Natural, skill-focused personalized reason
    let reason = "";
    if (matchedCandidateSkills.length > 0) {
      reason = `Your verified strengths in ${matchedCandidateSkills.slice(0, 3).join(", ")} directly match the requirements for this ${job.title} position.`;
    } else {
      const topSkills = finalSkillsList.slice(0, 3).join(", ");
      reason = `This role requires core competencies in ${topSkills} suited for your profile and career path.`;
    }

    return {
      jobId: job._id.toString(),
      matchScore: finalScore,
      reason,
      highlights: finalSkillsList.slice(0, 4),
    };
  });

  return matches.sort((a, b) => b.matchScore - a.matchScore).slice(0, 8);
};

// ─── AI Job Match Recommendations Controller ─────────────────────────────────
export const getAiJobMatches = catchAsyncErrors(async (req, res, next) => {
  // Only Job Seekers can use this feature
  if (!req.user || req.user.role !== "Job Seeker") {
    return next(
      new ErrorHandler("Only Job Seekers can use AI match recommendations.", 403)
    );
  }

  // ── 1. Fetch jobseeker profile ──────────────────────────────────────────
  const profile = await Jobseeker.findById(req.user._id).select("-password");
  if (!profile) {
    return next(new ErrorHandler("Jobseeker profile not found.", 404));
  }

  // ── 2. Fetch active jobs & enrich with Employer / Company details ───────
  const rawJobs = await Job.find({ expired: false }).lean();

  if (!rawJobs || rawJobs.length === 0) {
    return res.status(200).json({
      success: true,
      recommendations: [],
      message: "No active jobs found to analyze.",
    });
  }

  const postedByIdsRaw = rawJobs.map((j) => (j.postedBy?._id || j.postedBy)).filter(Boolean);
  const objIds = [];
  for (const id of postedByIdsRaw) {
    try {
      objIds.push(new mongoose.Types.ObjectId(id.toString()));
    } catch(e) {}
  }
  const queryIds = [...postedByIdsRaw, ...objIds];

  const users = await User.find({ _id: { $in: queryIds } }).select("name email company role profilePicture").lean();
  const employers = await Employer.find({ _id: { $in: queryIds } }).select("name email companyName tagline industry companySize founded website location description profilePicture faqs recruiterName recruiterTitle").lean();

  const userMap = new Map();
  users.forEach((u) => userMap.set(u._id.toString(), u));

  const employerMap = new Map();
  employers.forEach((e) => employerMap.set(e._id.toString(), e));

  const jobs = rawJobs.map((job) => {
    const pId = job.postedBy?._id ? job.postedBy._id.toString() : job.postedBy?.toString();
    const emp = pId ? employerMap.get(pId) : null;
    const usr = pId ? userMap.get(pId) : null;

    const resolvedCompanyName = (emp?.companyName && emp.companyName.trim() !== "")
      ? emp.companyName.trim()
      : (usr?.company?.name && usr.company.name.trim() !== "")
      ? usr.company.name.trim()
      : (emp?.name && emp.name.trim() !== "")
      ? `${emp.name.trim()}'s Company`
      : (usr?.name && usr.name.trim() !== "")
      ? `${usr.name.trim()}'s Company`
      : "Verified Employer";

    return {
      ...job,
      postedBy: {
        _id: pId || job.postedBy,
        name: emp?.name || usr?.name || "Employer",
        email: emp?.email || usr?.email || "",
        companyName: resolvedCompanyName,
        profilePicture: emp?.profilePicture || usr?.profilePicture || null,
      },
      companyName: resolvedCompanyName,
    };
  });

  // ── 3. Profile Summary Preparation ──────────────────────────────────────
  const rawKeySkills = (profile.keySkills || []).map((s) => s.trim()).filter(Boolean);
  const rawItSkills  = (profile.itSkillsList || []).map((s) => s.name?.trim()).filter(Boolean);
  const allCandidateSkillsForResponse = Array.from(new Set([...rawKeySkills, ...rawItSkills]));

  // Early return if jobseeker has NO skills at all
  if (allCandidateSkillsForResponse.length === 0) {
    return res.status(200).json({
      success: true,
      recommendations: [],
      profileName: profile.name,
      totalAnalyzed: 0,
      candidateSkills: [],
      noSkills: true,
    });
  }

  const skills = rawKeySkills.join(", ") || "Not specified";
  const location = profile.location || "Not specified";
  const education = (profile.educationList || [])
    .map((e) => `${e.degree || ""} in ${e.course || ""} from ${e.institute || ""}`)
    .join("; ") || "Not specified";
  const itSkills = (profile.itSkillsList || [])
    .map((s) => `${s.name} (${s.expYears || "0"}y)`)
    .join(", ") || "Not specified";
  const projects = (profile.projectsList || []).map((p) => p.title).join(", ") || "None listed";
  const summary = profile.profileSummary || "No summary provided";

  const profileText = `
Name: ${profile.name}
Location: ${location}
Key Skills: ${skills}
IT/Technical Skills: ${itSkills}
Education: ${education}
Projects: ${projects}
Profile Summary: ${summary}
  `.trim();

  // ── 4. Jobs List Preparation (Top 15 jobs for blazing fast AI response) ───
  const jobsForAI = jobs.slice(0, 15).map((j) => ({
    id: j._id.toString(),
    title: j.title,
    category: j.category,
    description: j.description?.slice(0, 120),
    location: `${j.city}, ${j.country}`,
  }));

  const jobsText = jobsForAI
    .map(
      (j, i) =>
        `[${i + 1}] ID: ${j.id}\nTitle: ${j.title}\nCategory: ${j.category}\nLocation: ${j.location}\nDescription: ${j.description}`
    )
    .join("\n\n");

  const geminiKey = (process.env.GEMINI_API_KEY || "").trim();
  let aiMatches = null;

  // ── 5. Attempt Gemini Generative AI Call if key is present ───────────────
  if (geminiKey && geminiKey !== "YOUR_GEMINI_API_KEY_HERE" && !geminiKey.includes("YOUR_")) {
    try {
      const prompt = `
You are a senior technical recruiter & AI career advisor. Analyze this jobseeker profile and find the TOP 8 best matching jobs from the list.

## JOBSEEKER PROFILE:
${profileText}

## AVAILABLE JOBS:
${jobsText}

## INSTRUCTIONS:
- Return ONLY valid JSON format (no markdown code blocks, no commentary).
- Score each match from 55 to 98 based on skill overlap and category.
- Provide a personalized 1-2 sentence match reason referencing actual skills.
- The "highlights" array MUST contain 2 to 4 specific technical/domain skills for this job.

JSON Format:
{
  "matches": [
    {
      "jobId": "exact_job_id_string",
      "matchScore": 92,
      "reason": "Personalized reason referencing actual skills.",
      "highlights": ["React", "Node.js", "MongoDB"]
    }
  ]
}
`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: "application/json",
            },
          }),
          signal: AbortSignal.timeout(25000),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidateText) {
          const cleaned = candidateText
            .replace(/^```json\s*/i, "")
            .replace(/^```\s*/i, "")
            .replace(/```\s*$/i, "")
            .trim();
          const parsed = JSON.parse(cleaned);
          if (parsed.matches && Array.isArray(parsed.matches) && parsed.matches.length > 0) {
            aiMatches = parsed.matches;
            console.log(`✅ Gemini AI Match generated ${aiMatches.length} recommendations for ${profile.name}`);
          }
        }
      } else {
        const errText = await response.text();
        console.warn("⚠️ Gemini API returned non-200 status:", response.status, errText);
      }
    } catch (apiError) {
      console.warn("⚠️ Gemini API network error (using profile matching engine):", apiError.message);
    }
  }

  // ── 6. Fallback to Smart Match Engine if AI call was skipped or failed ───
  if (!aiMatches || aiMatches.length === 0) {
    aiMatches = calculateLocalJobMatches(profile, jobs);
  }

  // ── 7. Merge Matches with Full Job Data ──────────────────────────────────
  const recommendations = aiMatches
    .map((match) => {
      const job = jobs.find((j) => j._id.toString() === match.jobId);
      if (!job) return null;

      const companyName =
        job.postedBy?.companyName ||
        job.postedBy?.name ||
        "Verified Employer";

      return {
        job: {
          _id: job._id,
          title: job.title,
          category: job.category,
          city: job.city,
          country: job.country,
          fixedSalary: job.fixedSalary,
          salaryFrom: job.salaryFrom,
          salaryTo: job.salaryTo,
          description: job.description,
          skills: job.skills || [],
          experience: job.experience || "Entry Level",
          jobType: job.jobType || "Full-Time",
          expired: job.expired,
          jobPostedOn: job.jobPostedOn,
          postedBy: job.postedBy,
          companyName,
        },
        matchScore: match.matchScore || 75,
        reason: match.reason || `Strong profile synergy with this ${job.category} position.`,
        highlights: (match.highlights || []).filter(
          (h) => h && !["software development", "location alignment"].includes(h.toLowerCase().trim())
        ),
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.matchScore - a.matchScore);

  res.status(200).json({
    success: true,
    recommendations,
    profileName: profile.name,
    totalAnalyzed: Math.min(jobs.length, 30),
    candidateSkills: allCandidateSkillsForResponse,
  });
});
