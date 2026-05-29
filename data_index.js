// ============================================================
// COURSE INDEX - Only metadata, no video/pdf data
// To add a new course:
//   1. Put the course JS file in the courses/ folder
//   2. Add an entry below with the same courseId as the filename
// ============================================================

const courseIndex = {
  english: {
    title: "English Spl-27 (Live + VOD)",
    teacher: "Gopal Verma Sir",
    icon: "ri-translate-2",
    color: "#8b5cf6",
    file: "courses/english.js",
    videosCount: 471,
    pdfsCount: 343
  },
  reasoning: {
    title: "Reasoning SPL-45",
    teacher: "Piyush Sir",
    icon: "ri-brain-line",
    color: "#3b82f6",
    file: "courses/reasoning.js",
    videosCount: 262,
    pdfsCount: 242
  },
  maths: {
    title: "Maths VOD (Arith+Adv) B-12",
    teacher: "Gagan Pratap Sir",
    icon: "ri-functions",
    color: "#ec4899",
    file: "courses/maths.js",
    videosCount: 507,
    pdfsCount: 99
  },
  biology: {
    title: "Biology Spl. (Theory+Pract.)",
    teacher: "Kajal Mam",
    icon: "ri-microscope-line",
    color: "#10b981",
    file: "courses/biology.js",
    videosCount: 186,
    pdfsCount: 26
  }
};
