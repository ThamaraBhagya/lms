"use client"; 

import React, { useState, useEffect } from 'react';
import AuthScreen from './components/AuthScreen';
import OnboardingScreen from './components/OnboardingScreen';
import DashboardHeader from './components/DashboardHeader';
import StudentAnalytics from './components/StudentAnalytics';
import CourseManagement from './components/CourseManagement';
import CourseDetailModal from './components/Modals/CourseDetailModal';
import { EnrollModal, ProfileModal, CreateCourseModal, CreateAssignmentModal } from './components/Modals/ActionModals';
import Toast from './components/Toast';

export default function EduFlowDashboard() {
  
  // --- Auth & User State ---
  const [token, setToken] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [user, setUser] = useState<any>({});
  
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500); 
  };

  // --- Onboarding & Profile State ---
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [isOnboarding, setIsOnboarding] = useState(false);
  
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editAge, setEditAge] = useState(20);
  const [editTuition, setEditTuition] = useState(1);
  const [editScholarship, setEditScholarship] = useState(0);
  const [editDebtor, setEditDebtor] = useState(0);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // --- Dashboard State ---
  const [currentView, setCurrentView] = useState<'students' | 'courses'>('courses');
  const [students, setStudents] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [lecturers, setLecturers] = useState<any[]>([]); 
  const [isLoading, setIsLoading] = useState(true);

  // --- Modals State ---
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [newCourseCode, setNewCourseCode] = useState("");
  const [newCourseTitle, setNewCourseTitle] = useState("");
  const [newCourseDesc, setNewCourseDesc] = useState("");
  const [newCourseLecturerId, setNewCourseLecturerId] = useState(""); 
  const [isCreatingCourse, setIsCreatingCourse] = useState(false);
  
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [assignTitle, setAssignTitle] = useState("");
  const [assignDesc, setAssignDesc] = useState("");
  const [assignDue, setAssignDue] = useState("");
  
  const [subUrls, setSubUrls] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState<{[key: string]: boolean}>({});
  const [gradeScores, setGradeScores] = useState<{[key: string]: string}>({});
  const [isGrading, setIsGrading] = useState<{[key: string]: boolean}>({});

  const [enrollCourse, setEnrollCourse] = useState<any>(null);
  const [enrollKey, setEnrollKey] = useState("");
  const [isEnrolling, setIsEnrolling] = useState(false);

  const API_URL =  "";

  useEffect(() => {
    const savedToken = localStorage.getItem("eduflow_token");
    if (savedToken) {
      setToken(savedToken);
      setUserRole(localStorage.getItem("eduflow_role"));
      setUserId(localStorage.getItem("eduflow_userId"));
      setUser({
        firstName: localStorage.getItem("eduflow_fname"),
        lastName: localStorage.getItem("eduflow_lname"),
        email: localStorage.getItem("eduflow_email")
      });
    }
  }, []);

  useEffect(() => {
    if (token) {
      if (userRole === 'STUDENT') checkOnboardingStatus();
      else { setHasProfile(true); fetchStudents(); }
      if (userRole === 'ADMIN') fetchLecturers(); 
      fetchCourses();
    }
  }, [token, userRole]);

  useEffect(() => {
    if (selectedCourse && courses.length > 0) {
      const updatedCourse = courses.find(c => c.id === selectedCourse.id);
      if (updatedCourse) setSelectedCourse(updatedCourse);
    }
  }, [courses]);

  // ================= API CALLS =================
  const checkOnboardingStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/api/profile/me`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.status === 404) setHasProfile(false);
      else if (res.ok) setHasProfile(true);
    } catch (err) { console.error(err); }
  };

  const handleLogin = async (e: React.FormEvent, email: string, pass: string) => {
    e.preventDefault();
    try {
      const formData = new URLSearchParams({ username: email, password: pass });
      const res = await fetch(`${API_URL}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: formData });
      if (!res.ok) throw new Error("Invalid credentials");
      const data = await res.json();
      
      localStorage.setItem("eduflow_token", data.access_token);
      localStorage.setItem("eduflow_role", data.user.role);
      localStorage.setItem("eduflow_userId", data.user.id);
      localStorage.setItem("eduflow_fname", data.user.firstName);
      localStorage.setItem("eduflow_lname", data.user.lastName);
      localStorage.setItem("eduflow_email", data.user.email);
      
      setToken(data.access_token); setUserRole(data.user.role); setUserId(data.user.id);
      setUser(data.user);
      setCurrentView(data.user.role === 'STUDENT' ? 'courses' : 'students');
      showToast(`Welcome back, ${data.user.firstName}!`, "success");
    } catch (err: any) { showToast(err.message, "error"); }
  };

  const handleRegister = async (e: React.FormEvent, regData: any) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(regData) });
      if (!res.ok) { const err = await res.json(); throw new Error(err.detail || "Registration failed"); }
      showToast("Account created! Please sign in.", "success");
    } catch (err: any) { showToast(err.message, "error"); }
  };

  const handleLogout = () => {
    localStorage.clear();
    setToken(null); setUserRole(null); setUserId(null); setHasProfile(null);
    setStudents([]); setCourses([]); setSelectedCourse(null); setUser({});
  };

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/students`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.status === 401) return handleLogout();
      const data = await res.json(); setStudents(data);
    } catch (error) { console.error(error); } finally { setIsLoading(false); }
  };

  const fetchCourses = async () => {
    try {
      const res = await fetch(`${API_URL}/api/courses`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) { const data = await res.json(); setCourses(data); }
    } catch (error) { console.error(error); }
  };

  const fetchLecturers = async () => {
    try {
      const res = await fetch(`${API_URL}/api/users/lecturers`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) { const data = await res.json(); setLecturers(data); }
    } catch (error) { console.error(error); }
  };

  const submitOnboarding = async (e: React.FormEvent, data: any) => {
    e.preventDefault(); setIsOnboarding(true);
    try {
      const res = await fetch(`${API_URL}/api/profile/onboard`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ ageAtEnrollment: data.age, admissionGrade: data.admission, tuitionUpToDate: data.tuition, scholarship: data.scholarship, debtor: data.debtor }) });
      if (!res.ok) throw new Error("Failed to save profile.");
      setHasProfile(true); showToast("Profile complete!", "success");
    } catch (err: any) { showToast(err.message, "error"); } finally { setIsOnboarding(false); }
  };

  const openEditProfileModal = async () => {
    try {
      const res = await fetch(`${API_URL}/api/profile/me`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setEditAge(data.ageAtEnrollment); setEditTuition(data.tuitionUpToDate); setEditScholarship(data.scholarship); setEditDebtor(data.debtor);
        setShowProfileModal(true);
      }
    } catch (err) { showToast("Failed to load profile data.", "error"); }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault(); setIsUpdatingProfile(true);
    try {
      const res = await fetch(`${API_URL}/api/profile/me`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ ageAtEnrollment: editAge, tuitionUpToDate: editTuition, scholarship: editScholarship, debtor: editDebtor }) });
      if (!res.ok) throw new Error("Failed to update");
      showToast("Profile updated!", "success"); setShowProfileModal(false);
    } catch (err: any) { showToast(err.message, "error"); } finally { setIsUpdatingProfile(false); }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault(); if (!newCourseLecturerId) return showToast("Assign a lecturer.", "error");
    setIsCreatingCourse(true);
    try {
      const res = await fetch(`${API_URL}/api/courses`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ courseCode: newCourseCode, title: newCourseTitle, description: newCourseDesc, lecturerId: newCourseLecturerId }) });
      if (!res.ok) { const err = await res.json(); throw new Error(err.detail || "Failed to create"); }
      await fetchCourses(); setShowCourseModal(false); setNewCourseCode(""); setNewCourseTitle(""); setNewCourseDesc(""); setNewCourseLecturerId("");
      showToast("Course created!", "success");
    } catch (error: any) { showToast(error.message, "error"); } finally { setIsCreatingCourse(false); }
  };

  const handleConfirmEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (enrollKey.toUpperCase() !== enrollCourse.courseCode.toUpperCase()) return showToast("Incorrect Key.", "error");
    setIsEnrolling(true);
    try {
      const res = await fetch(`${API_URL}/api/courses/${enrollCourse.id}/enroll`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) { const err = await res.json(); throw new Error(err.detail || "Failed to enroll"); }
      await fetchCourses(); showToast(`Enrolled in ${enrollCourse.title}!`, "success");
      setEnrollCourse(null); setEnrollKey("");
    } catch (error: any) { showToast(error.message, "error"); } finally { setIsEnrolling(false); }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isoDate = new Date(assignDue).toISOString();
      const res = await fetch(`${API_URL}/api/courses/${selectedCourse.id}/assignments`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ title: assignTitle, description: assignDesc, dueDate: isoDate, maxScore: 20 }) });
      if (!res.ok) { const err = await res.json(); throw new Error(err.detail || "Failed to create"); }
      await fetchCourses(); setShowAssignmentModal(false); setAssignTitle(""); setAssignDesc(""); setAssignDue("");
      showToast("Assignment posted!", "success");
    } catch (error: any) { showToast(error.message, "error"); }
  };

  const handleSubmitWork = async (assignmentId: string) => {
    const targetUrl = subUrls[assignmentId];
    if (!targetUrl) return showToast("Please enter a URL.", "error");
    setIsSubmitting({...isSubmitting, [assignmentId]: true});
    try {
      const res = await fetch(`${API_URL}/api/assignments/${assignmentId}/submit`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ contentUrl: targetUrl }) });
      if (!res.ok) throw new Error("Failed to submit");
      setSubUrls({...subUrls, [assignmentId]: ""}); await fetchCourses(); showToast("Work submitted!", "success");
    } catch (error: any) { showToast(error.message, "error"); } finally { setIsSubmitting({...isSubmitting, [assignmentId]: false}); }
  };

  const handleGradeSubmission = async (submissionId: string) => {
    const scoreToSubmit = gradeScores[submissionId];
    if (!scoreToSubmit) return showToast("Enter a score.", "error");
    setIsGrading({...isGrading, [submissionId]: true});
    try {
      const res = await fetch(`${API_URL}/api/submissions/${submissionId}/grade`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ score: Number(scoreToSubmit) }) });
      if (!res.ok) { const err = await res.json(); throw new Error(err.detail || "Failed to grade"); }
      await fetchCourses(); if (userRole !== 'STUDENT') await fetchStudents(); showToast("Grade saved!", "success");
    } catch (error: any) { showToast(error.message, "error"); } finally { setIsGrading({...isGrading, [submissionId]: false}); }
  };

  // ================= DATA PREP =================
  const generatePieChartData = () => {
    let grad = 0, drop = 0, enr = 0, pen = 0;
    students.forEach(s => {
      if (!s.profile || !s.aiPredictions?.length) pen++;
      else {
        const pred = s.aiPredictions[0].prediction.toUpperCase();
        if (pred === 'GRADUATE') grad++; else if (pred === 'DROPOUT') drop++; else enr++;
      }
    });
    return [{ name: 'Graduate', value: grad, color: '#10b981' }, { name: 'Dropout', value: drop, color: '#f43f5e' }, { name: 'Enrolled', value: enr, color: '#f59e0b' }, { name: 'Pending', value: pen, color: '#94a3b8' }].filter(d => d.value > 0);
  };
  
  const generateBarChartData = () => students.filter(s => s.profile).map(s => ({ name: `${s.firstName} ${s.lastName[0]}.`, Grade: s.profile.grades1stSem || 0 }));
  
  let primaryCourses = [], secondaryCourses = [], primaryTitle = "", secondaryTitle = "";
  if (userRole === 'STUDENT') {
    primaryCourses = courses.filter(c => c.enrollments?.some((e:any) => e.studentId === userId)); secondaryCourses = courses.filter(c => !c.enrollments?.some((e:any) => e.studentId === userId));
    primaryTitle = "My Enrolled Modules"; secondaryTitle = "Available Modules";
  } else if (userRole === 'LECTURER') {
    primaryCourses = courses.filter(c => c.lecturerId === userId); secondaryCourses = courses.filter(c => c.lecturerId !== userId);
    primaryTitle = "My Assigned Modules"; secondaryTitle = "Other Faculty Modules";
  } else {
    primaryCourses = courses; primaryTitle = "All System Modules";
  }

  // ================= RENDER =================
  if (!token) return <AuthScreen handleLogin={handleLogin} handleRegister={handleRegister} toast={toast} />;
  if (userRole === 'STUDENT' && hasProfile === false) return <OnboardingScreen submitOnboarding={submitOnboarding} handleLogout={handleLogout} isOnboarding={isOnboarding} toast={toast} />;

  return (
    <main className="min-h-screen bg-slate-50 p-8 font-sans text-slate-800 relative">
      <Toast toast={toast} />
      <EnrollModal enrollCourse={enrollCourse} enrollKey={enrollKey} setEnrollKey={setEnrollKey} handleConfirmEnroll={handleConfirmEnroll} isEnrolling={isEnrolling} setEnrollCourse={setEnrollCourse} />
      <ProfileModal showProfileModal={showProfileModal} setShowProfileModal={setShowProfileModal} handleUpdateProfile={handleUpdateProfile} isUpdatingProfile={isUpdatingProfile} editState={{editAge, setEditAge, editTuition, setEditTuition, editScholarship, setEditScholarship, editDebtor, setEditDebtor}} />
      <CreateCourseModal showCourseModal={showCourseModal} setShowCourseModal={setShowCourseModal} handleCreateCourse={handleCreateCourse} isCreatingCourse={isCreatingCourse} lecturers={lecturers} courseState={{newCourseCode, setNewCourseCode, newCourseTitle, setNewCourseTitle, newCourseDesc, setNewCourseDesc, newCourseLecturerId, setNewCourseLecturerId}} />
      <CreateAssignmentModal showAssignmentModal={showAssignmentModal} setShowAssignmentModal={setShowAssignmentModal} handleCreateAssignment={handleCreateAssignment} assignState={{assignTitle, setAssignTitle, assignDesc, setAssignDesc, assignDue, setAssignDue}} />
      <CourseDetailModal selectedCourse={selectedCourse} setSelectedCourse={setSelectedCourse} userRole={userRole} userId={userId} setShowAssignmentModal={setShowAssignmentModal} subUrls={subUrls} setSubUrls={setSubUrls} handleSubmitWork={handleSubmitWork} isSubmitting={isSubmitting} gradeScores={gradeScores} setGradeScores={setGradeScores} handleGradeSubmission={handleGradeSubmission} isGrading={isGrading} />
      
      <DashboardHeader userRole={userRole} currentView={currentView} setCurrentView={setCurrentView} user={user} openEditProfileModal={openEditProfileModal} handleLogout={handleLogout} />
      
      {currentView === 'students' && userRole !== 'STUDENT' && <StudentAnalytics students={students} isLoading={isLoading} pieData={generatePieChartData()} barData={generateBarChartData()} />}
      {currentView === 'courses' && <CourseManagement primaryCourses={primaryCourses} secondaryCourses={secondaryCourses} primaryTitle={primaryTitle} secondaryTitle={secondaryTitle} userRole={userRole} userId={userId} setShowCourseModal={setShowCourseModal} setEnrollCourse={setEnrollCourse} setSelectedCourse={setSelectedCourse} />}
    </main>
  );
}