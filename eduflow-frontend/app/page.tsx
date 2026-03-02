"use client"; 

import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

export default function EduFlowDashboard() {
  // --- Auth & User State ---
  const [token, setToken] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
  // NEW: Store User Details for the Premium Profile Menu
  const [userFirstName, setUserFirstName] = useState("");
  const [userLastName, setUserLastName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [loginEmail, setLoginEmail] = useState("test@eduflow.local");
  const [loginPassword, setLoginPassword] = useState("supersecretpassword123");
  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRole, setRegRole] = useState("STUDENT");

  // --- NEW: Premium Toast Notification System ---
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500); // Auto-dismiss after 3.5 seconds
  };

  // --- Onboarding & Profile State ---
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [onboardAge, setOnboardAge] = useState(20);
  const [onboardAdmission, setOnboardAdmission] = useState(120.0);
  const [onboardTuition, setOnboardTuition] = useState(1);
  const [onboardScholarship, setOnboardScholarship] = useState(0);
  const [onboardDebtor, setOnboardDebtor] = useState(0);

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
  
  const [subUrl, setSubUrl] = useState("");
  const [gradeScores, setGradeScores] = useState<{[key: string]: string}>({});

  // --- NEW: Enrollment Key State ---
  const [enrollCourse, setEnrollCourse] = useState<any>(null);
  const [enrollKey, setEnrollKey] = useState("");
  const [isEnrolling, setIsEnrolling] = useState(false);

  useEffect(() => {
    const savedToken = localStorage.getItem("eduflow_token");
    const savedRole = localStorage.getItem("eduflow_role");
    const savedUserId = localStorage.getItem("eduflow_userId"); 
    const fName = localStorage.getItem("eduflow_fname");
    const lName = localStorage.getItem("eduflow_lname");
    const email = localStorage.getItem("eduflow_email");

    if (savedToken) setToken(savedToken);
    if (savedRole) setUserRole(savedRole);
    if (savedUserId) setUserId(savedUserId);
    if (fName) setUserFirstName(fName);
    if (lName) setUserLastName(lName);
    if (email) setUserEmail(email);
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

  const checkOnboardingStatus = async () => {
    try {
      const res = await fetch('http://127.0.0.1:4000/api/profile/me', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.status === 404) setHasProfile(false);
      else if (res.ok) setHasProfile(true);
    } catch (err) { console.error(err); }
  };

  const submitOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsOnboarding(true);
    try {
      const res = await fetch('http://127.0.0.1:4000/api/profile/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ageAtEnrollment: onboardAge, admissionGrade: onboardAdmission, tuitionUpToDate: onboardTuition, scholarship: onboardScholarship, debtor: onboardDebtor })
      });
      if (!res.ok) throw new Error("Failed to save profile.");
      setHasProfile(true);
      showToast("Profile completely successfully!", "success");
    } catch (err: any) { showToast(err.message, "error"); } finally { setIsOnboarding(false); }
  };

  const openEditProfileModal = async () => {
    try {
      const res = await fetch('http://127.0.0.1:4000/api/profile/me', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setEditAge(data.ageAtEnrollment);
        setEditTuition(data.tuitionUpToDate);
        setEditScholarship(data.scholarship);
        setEditDebtor(data.debtor);
        setShowProfileModal(true);
        setShowUserMenu(false); // Close dropdown if open
      }
    } catch (err) { showToast("Failed to load profile data.", "error"); }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      const res = await fetch('http://127.0.0.1:4000/api/profile/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ageAtEnrollment: editAge, tuitionUpToDate: editTuition, scholarship: editScholarship, debtor: editDebtor })
      });
      if (!res.ok) throw new Error("Failed to update profile");
      showToast("Profile updated. AI Prediction recalculated!", "success");
      setShowProfileModal(false);
    } catch (err: any) { showToast(err.message, "error"); } finally { setIsUpdatingProfile(false); }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new URLSearchParams();
      formData.append("username", loginEmail);
      formData.append("password", loginPassword);
      const res = await fetch('http://127.0.0.1:4000/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: formData });
      if (!res.ok) throw new Error("Invalid credentials");
      const data = await res.json();
      
      localStorage.setItem("eduflow_token", data.access_token);
      localStorage.setItem("eduflow_role", data.user.role);
      localStorage.setItem("eduflow_userId", data.user.id);
      localStorage.setItem("eduflow_fname", data.user.firstName);
      localStorage.setItem("eduflow_lname", data.user.lastName);
      localStorage.setItem("eduflow_email", data.user.email);
      
      setToken(data.access_token); setUserRole(data.user.role); setUserId(data.user.id);
      setUserFirstName(data.user.firstName); setUserLastName(data.user.lastName); setUserEmail(data.user.email);
      
      if (data.user.role === 'STUDENT') setCurrentView('courses');
      else setCurrentView('students');
      
      showToast(`Welcome back, ${data.user.firstName}!`, "success");
    } catch (err: any) { showToast(err.message, "error"); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://127.0.0.1:4000/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName: regFirstName, lastName: regLastName, email: regEmail, password: regPassword, role: regRole })
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.detail || "Registration failed"); }
      setLoginEmail(regEmail); setRegPassword(""); setAuthMode('login');
      showToast("Account created! Please sign in.", "success");
    } catch (err: any) { showToast(err.message, "error"); }
  };

  const handleLogout = () => {
    localStorage.clear();
    setToken(null); setUserRole(null); setUserId(null); setHasProfile(null);
    setStudents([]); setCourses([]); setSelectedCourse(null);
    setUserFirstName(""); setUserLastName(""); setUserEmail(""); setShowUserMenu(false);
  };

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:4000/api/students', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.status === 401) return handleLogout();
      const data = await res.json(); setStudents(data);
    } catch (error) { console.error(error); } finally { setIsLoading(false); }
  };

  const fetchCourses = async () => {
    try {
      const res = await fetch('http://127.0.0.1:4000/api/courses', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) { const data = await res.json(); setCourses(data); }
    } catch (error) { console.error(error); }
  };

  const fetchLecturers = async () => {
    try {
      const res = await fetch('http://127.0.0.1:4000/api/users/lecturers', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) { const data = await res.json(); setLecturers(data); }
    } catch (error) { console.error(error); }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseLecturerId) return showToast("You must assign a lecturer to this course.", "error");
    setIsCreatingCourse(true);
    try {
      const res = await fetch('http://127.0.0.1:4000/api/courses', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ courseCode: newCourseCode, title: newCourseTitle, description: newCourseDesc, lecturerId: newCourseLecturerId })
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.detail || "Failed to create course"); }
      await fetchCourses(); setShowCourseModal(false);
      setNewCourseCode(""); setNewCourseTitle(""); setNewCourseDesc(""); setNewCourseLecturerId("");
      showToast("Course created successfully!", "success");
    } catch (error: any) { showToast(error.message, "error"); } finally { setIsCreatingCourse(false); }
  };

  // --- NEW: Handle Enrollment Key Check ---
  const handleConfirmEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (enrollKey.toUpperCase() !== enrollCourse.courseCode.toUpperCase()) {
      return showToast("Incorrect Course Key. Please check the code.", "error");
    }
    
    setIsEnrolling(true);
    try {
      const res = await fetch(`http://127.0.0.1:4000/api/courses/${enrollCourse.id}/enroll`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) { const err = await res.json(); throw new Error(err.detail || "Failed to enroll"); }
      await fetchCourses();
      showToast(`Successfully enrolled in ${enrollCourse.title}!`, "success");
      setEnrollCourse(null); setEnrollKey("");
    } catch (error: any) { showToast(error.message, "error"); } finally { setIsEnrolling(false); }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isoDate = new Date(assignDue).toISOString();
      const res = await fetch(`http://127.0.0.1:4000/api/courses/${selectedCourse.id}/assignments`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ title: assignTitle, description: assignDesc, dueDate: isoDate, maxScore: 20 })
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.detail || "Failed to create assignment"); }
      await fetchCourses(); 
      setShowAssignmentModal(false); setAssignTitle(""); setAssignDesc(""); setAssignDue("");
      showToast("Assignment posted to course!", "success");
    } catch (error: any) { showToast(error.message, "error"); }
  };

  const handleSubmitWork = async (assignmentId: string) => {
    if (!subUrl) return showToast("Please enter a URL to submit.", "error");
    try {
      const res = await fetch(`http://127.0.0.1:4000/api/assignments/${assignmentId}/submit`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ contentUrl: subUrl })
      });
      if (!res.ok) throw new Error("Failed to submit work");
      setSubUrl(""); await fetchCourses(); 
      showToast("Work submitted successfully!", "success");
    } catch (error: any) { showToast(error.message, "error"); }
  };

  const handleGradeSubmission = async (submissionId: string) => {
    const scoreToSubmit = gradeScores[submissionId];
    if (!scoreToSubmit) return showToast("Please enter a score.", "error");
    try {
      const res = await fetch(`http://127.0.0.1:4000/api/submissions/${submissionId}/grade`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ score: Number(scoreToSubmit) })
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.detail || "Failed to grade"); }
      await fetchCourses();
      if (userRole !== 'STUDENT') await fetchStudents(); 
      showToast("Grade saved and AI Prediction updated!", "success");
    } catch (error: any) { showToast(error.message, "error"); }
  };

  const isCourseOwner = selectedCourse && (userRole === 'ADMIN' || (userRole === 'LECTURER' && selectedCourse.lecturerId === userId));

  // Data Viz Logic
  const generatePieChartData = () => {
    let graduate = 0; let dropout = 0; let enrolled = 0; let pending = 0;
    students.forEach(s => {
      if (!s.profile || !s.aiPredictions || s.aiPredictions.length === 0) pending++;
      else {
        const pred = s.aiPredictions[0].prediction.toUpperCase();
        if (pred === 'GRADUATE') graduate++;
        else if (pred === 'DROPOUT') dropout++;
        else enrolled++;
      }
    });
    return [
      { name: 'On Track (Graduate)', value: graduate, color: '#10b981' }, 
      { name: 'At Risk (Dropout)', value: dropout, color: '#f43f5e' }, 
      { name: 'Neutral (Enrolled)', value: enrolled, color: '#f59e0b' }, 
      { name: 'Awaiting Data', value: pending, color: '#94a3b8' } 
    ].filter(d => d.value > 0);
  };
  const generateBarChartData = () => {
    return students.filter(s => s.profile !== null).map(s => ({
        name: `${s.firstName} ${s.lastName[0]}.`, Grade: s.profile.grades1stSem || 0, Passed: s.profile.classesPassed || 0
    }));
  };
  const pieData = generatePieChartData(); const barData = generateBarChartData();

  // =======================================
  // VIEW: AUTHETICATION (Login / Register)
  // =======================================
  if (!token) {
    return (
      <main 
        className="min-h-screen flex items-center justify-center p-4 font-sans relative overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop')" }}
      >
        {/* Dark Glass Overlay */}
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"></div>

        {/* Premium Toast Overlay */}
        {toast && (
          <div className={`absolute top-6 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full shadow-2xl text-sm font-bold text-white transition-all animate-slide-in-down z-50 ${toast.type === 'error' ? 'bg-rose-500' : 'bg-emerald-500'}`}>
            {toast.msg}
          </div>
        )}

        {/* Auth Box - Tweaked transparency (bg-white/80) for a better glass effect */}
        <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl w-full max-w-md border border-white/40 z-10 relative">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-blue-600 rounded-xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-blue-600/30">
              <span className="text-white font-bold text-xl">E</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">EduFlow</h1>
            <p className="text-slate-600 mt-2 text-sm font-medium">Next-Generation Learning Analytics</p>
          </div>

          {/* Toggle Buttons - Changed to transparent white so it blends with the glass */}
          <div className="flex bg-white/50 backdrop-blur-md p-1 rounded-xl mb-8 border border-white/60 shadow-sm">
            <button 
              onClick={() => setAuthMode('login')} 
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${authMode === 'login' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-600 hover:text-slate-800'}`}
            >
              Sign In
            </button>
            <button 
              onClick={() => setAuthMode('register')} 
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${authMode === 'register' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-600 hover:text-slate-800'}`}
            >
              Register
            </button>
          </div>
          
          {/* LOGIN FORM */}
          {authMode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Email Address</label>
                {/* Inputs changed from bg-slate-50 to translucent white with a border */}
                <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="w-full bg-white/60 border border-white/50 backdrop-blur-sm rounded-xl p-3 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 transition-all shadow-sm" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Password</label>
                <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="w-full bg-white/60 border border-white/50 backdrop-blur-sm rounded-xl p-3 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 transition-all shadow-sm" required />
              </div>
              <button type="submit" className="w-full mt-2 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-all hover:shadow-lg hover:shadow-blue-600/30 active:scale-95">
                Access Dashboard
              </button>
            </form>
          )}

          {/* REGISTER FORM */}
          {authMode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">First Name</label>
                  <input type="text" value={regFirstName} onChange={(e) => setRegFirstName(e.target.value)} className="w-full bg-white/60 border border-white/50 backdrop-blur-sm rounded-xl p-3 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 transition-all shadow-sm" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Last Name</label>
                  <input type="text" value={regLastName} onChange={(e) => setRegLastName(e.target.value)} className="w-full bg-white/60 border border-white/50 backdrop-blur-sm rounded-xl p-3 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 transition-all shadow-sm" required />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Email</label>
                <input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} className="w-full bg-white/60 border border-white/50 backdrop-blur-sm rounded-xl p-3 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 transition-all shadow-sm" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Password</label>
                <input type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} className="w-full bg-white/60 border border-white/50 backdrop-blur-sm rounded-xl p-3 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 transition-all shadow-sm" required minLength={6} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">I am a...</label>
                <select value={regRole} onChange={(e) => setRegRole(e.target.value)} className="w-full bg-white/60 border border-white/50 backdrop-blur-sm rounded-xl p-3 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 font-semibold cursor-pointer transition-all shadow-sm">
                  <option value="STUDENT">Student</option>
                  <option value="LECTURER">Lecturer / Faculty</option>
                </select>
              </div>
              <button type="submit" className="w-full mt-4 bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-all hover:shadow-lg active:scale-95">
                Create Account
              </button>
            </form>
          )}
        </div>
      </main>
    );
  }

  // =======================================
  // VIEW: STUDENT ONBOARDING
  // =======================================
  if (userRole === 'STUDENT' && hasProfile === false) {
    return (
      <main className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans relative">
         {toast && (
          <div className={`absolute top-6 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full shadow-lg text-sm font-bold text-white transition-all z-50 ${toast.type === 'error' ? 'bg-rose-500' : 'bg-emerald-500'}`}>
            {toast.msg}
          </div>
        )}
        <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-700">
          <div className="text-center mb-8"><h1 className="text-3xl font-bold text-slate-900">Welcome to EduFlow</h1><p className="text-slate-500 mt-2">Please complete your academic profile to access courses.</p></div>
          <form onSubmit={submitOnboarding} className="space-y-5">
            <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-semibold text-slate-700 mb-1">Age</label><input type="number" value={onboardAge} onChange={(e) => setOnboardAge(Number(e.target.value))} className="w-full bg-slate-50 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 border-none" required /></div><div><label className="block text-sm font-semibold text-slate-700 mb-1">Admission Score</label><input type="number" step="0.1" value={onboardAdmission} onChange={(e) => setOnboardAdmission(Number(e.target.value))} className="w-full bg-slate-50 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 border-none" required /></div></div>
            <div><label className="block text-sm font-semibold text-slate-700 mb-1">Tuition Status</label><select value={onboardTuition} onChange={(e) => setOnboardTuition(Number(e.target.value))} className="w-full bg-slate-50 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 border-none"><option value={1}>Up to Date</option><option value={0}>In Debt</option></select></div>
            <div><label className="block text-sm font-semibold text-slate-700 mb-1">Scholarship</label><select value={onboardScholarship} onChange={(e) => setOnboardScholarship(Number(e.target.value))} className="w-full bg-slate-50 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 border-none"><option value={1}>Yes (Active)</option><option value={0}>No</option></select></div>
            <div><label className="block text-sm font-semibold text-slate-700 mb-1">Other Institutional Debt</label><select value={onboardDebtor} onChange={(e) => setOnboardDebtor(Number(e.target.value))} className="w-full bg-slate-50 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 border-none"><option value={1}>Yes (Owes Money)</option><option value={0}>No (Clear)</option></select></div>
            <button type="submit" disabled={isOnboarding} className="w-full mt-6 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-all hover:shadow-lg hover:shadow-blue-600/30 active:scale-95 disabled:opacity-50">{isOnboarding ? "Saving..." : "Complete Profile"}</button>
            <button type="button" onClick={handleLogout} className="w-full mt-2 text-slate-400 text-sm font-semibold hover:text-slate-600 transition-colors">Sign Out</button>
          </form>
        </div>
      </main>
    );
  }

  // =======================================
  // VIEW: MAIN DASHBOARD
  // =======================================
  return (
    <main className="min-h-screen bg-slate-50 p-8 font-sans text-slate-800 relative">
      
      {/* TOAST NOTIFICATION OVERLAY */}
      {toast && (
        <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full shadow-xl text-sm font-bold text-white transition-all z-50 ${toast.type === 'error' ? 'bg-rose-500 shadow-rose-500/20' : 'bg-slate-900 shadow-slate-900/20'}`}>
          {toast.msg}
        </div>
      )}

      {/* ENROLLMENT KEY MODAL */}
      {enrollCourse && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden p-6 transform scale-100">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">🔒</div>
              <h3 className="text-xl font-bold text-slate-900">Enroll in {enrollCourse.courseCode}</h3>
              <p className="text-sm text-slate-500 mt-1">Enter the access key provided by your lecturer.</p>
            </div>
            <form onSubmit={handleConfirmEnroll}>
              <input type="text" placeholder="Course Code Key" required value={enrollKey} onChange={(e) => setEnrollKey(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-center font-mono tracking-widest uppercase focus:ring-2 focus:ring-blue-500 outline-none mb-6" />
              <div className="flex gap-3">
                <button type="button" onClick={() => {setEnrollCourse(null); setEnrollKey("");}} className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors">Cancel</button>
                <button type="submit" disabled={isEnrolling} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/30 active:scale-95 disabled:opacity-50">Join Course</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PROFILE MODAL */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center"><h3 className="text-xl font-bold text-slate-900">Update Profile</h3><button onClick={() => setShowProfileModal(false)} className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors font-bold">&times;</button></div>
            <form onSubmit={handleUpdateProfile} className="p-8 space-y-5">
              <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Current Age</label><input type="number" value={editAge} onChange={(e) => setEditAge(Number(e.target.value))} className="w-full bg-slate-50 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500" required /></div>
              <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tuition Status</label><select value={editTuition} onChange={(e) => setEditTuition(Number(e.target.value))} className="w-full bg-slate-50 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500"><option value={1}>Up to Date</option><option value={0}>In Debt</option></select></div>
              <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Scholarship</label><select value={editScholarship} onChange={(e) => setEditScholarship(Number(e.target.value))} className="w-full bg-slate-50 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500"><option value={1}>Yes (Active)</option><option value={0}>No</option></select></div>
              <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Other Institutional Debt</label><select value={editDebtor} onChange={(e) => setEditDebtor(Number(e.target.value))} className="w-full bg-slate-50 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500"><option value={1}>Yes (Owes Money)</option><option value={0}>No (Clear)</option></select></div>
              <div className="flex gap-3 mt-8">
                <button type="button" onClick={() => setShowProfileModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors">Cancel</button>
                <button type="submit" disabled={isUpdatingProfile} className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all hover:shadow-lg active:scale-95 disabled:opacity-50">Save & Analyze</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COURSE DETAILS MODAL */}
      {selectedCourse && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-end z-40">
          <div className="bg-white w-full max-w-2xl h-full overflow-y-auto shadow-2xl p-10 transform transition-transform border-l border-slate-200">
            <div className="flex justify-between items-start mb-8">
              <div>
                <span className="px-3 py-1 bg-blue-50 text-blue-600 border border-blue-100 text-xs font-bold rounded-full mb-4 inline-block tracking-wider uppercase">{selectedCourse.courseCode}</span>
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">{selectedCourse.title}</h2>
                <p className="text-slate-500 mt-3 leading-relaxed">{selectedCourse.description}</p>
              </div>
              <button onClick={() => setSelectedCourse(null)} className="w-10 h-10 flex items-center justify-center bg-slate-100 rounded-full hover:bg-slate-200 text-slate-500 transition-colors">&times;</button>
            </div>

            {/* --- NEW: Enrolled Students List (Faculty Only) --- */}
            {userRole !== 'STUDENT' && (
              <div className="mb-10 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider">Class Roster ({selectedCourse.enrollments?.length || 0})</h3>
                {selectedCourse.enrollments?.length === 0 ? (
                  <p className="text-sm text-slate-400 italic">No students enrolled yet.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {selectedCourse.enrollments.map((e: any) => (
                      <span key={e.id} className="bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm">
                        {e.student?.firstName} {e.student?.lastName}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {isCourseOwner && (
               <div className="mb-8 border-b border-slate-100 pb-8">
                 <button onClick={() => setShowAssignmentModal(true)} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all hover:shadow-lg active:scale-95">+ Create Assignment</button>
               </div>
            )}

            <h3 className="text-xl font-bold text-slate-900 mb-6">Assignments</h3>
            
            {(!selectedCourse.assignments || selectedCourse.assignments.length === 0) ? (
              <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-8 text-center"><p className="text-slate-500 font-medium">No assignments posted yet.</p></div>
            ) : (
              <div className="space-y-6">
                {selectedCourse.assignments.map((assignment: any) => {
                  const mySubmission = assignment.submissions?.find((s: any) => s.studentId === userId);
                  return (
                    <div key={assignment.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="text-lg font-bold text-slate-900">{assignment.title}</h4>
                        <span className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-full uppercase tracking-wide">Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-slate-600 mb-6 leading-relaxed">{assignment.description}</p>

                      {userRole === 'STUDENT' && (
                        <div className="pt-5 border-t border-slate-100">
                          {mySubmission ? (
                            <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl">
                              <span className="text-sm text-slate-600 font-medium">Work Submitted: <a href={mySubmission.contentUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-bold ml-1">View Link</a></span>
                              {mySubmission.score !== null ? (
                                <span className="font-bold text-emerald-700 bg-emerald-100 px-4 py-1.5 rounded-lg">Score: {mySubmission.score} / {assignment.maxScore}</span>
                              ) : (
                                <span className="font-bold text-amber-600 bg-amber-50 px-4 py-1.5 rounded-lg border border-amber-100">Grading Pending</span>
                              )}
                            </div>
                          ) : (
                            <div className="flex gap-3">
                              <input type="url" placeholder="Paste link to your work (e.g. Google Doc)" value={subUrl} onChange={(e) => setSubUrl(e.target.value)} className="flex-1 bg-slate-50 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none border border-slate-200" />
                              <button onClick={() => handleSubmitWork(assignment.id)} className="px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95">Submit</button>
                            </div>
                          )}
                        </div>
                      )}

                      {isCourseOwner && (
                        <div className="pt-5 border-t border-slate-100">
                          <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Student Submissions ({assignment.submissions?.length || 0})</h5>
                          {assignment.submissions?.map((sub: any) => {
                             // Find student name from course enrollments
                             const enrolledInfo = selectedCourse.enrollments?.find((e:any) => e.studentId === sub.studentId);
                             const studentName = enrolledInfo ? `${enrolledInfo.student.firstName} ${enrolledInfo.student.lastName}` : `ID: ${sub.studentId.substring(0,8)}`;

                             return (
                              <div key={sub.id} className="flex items-center justify-between bg-slate-50 p-4 rounded-xl mb-3 border border-slate-100">
                                <div>
                                  <span className="text-sm font-bold text-slate-800 block mb-1">{studentName}</span>
                                  <div className="flex items-center text-xs text-slate-500">
                                    <a href={sub.contentUrl} target="_blank" rel="noreferrer" className="text-blue-600 font-bold hover:underline border-r border-slate-300 pr-3 mr-3">View Work</a>
                                    <span>Sent: {new Date(sub.submittedAt).toLocaleDateString()}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  {sub.score !== null ? (
                                    <span className="font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">{sub.score} / {assignment.maxScore}</span>
                                  ) : (
                                    <>
                                      <input type="number" step="0.1" max="20" placeholder="Score" value={gradeScores[sub.id] || ''} onChange={(e) => setGradeScores({...gradeScores, [sub.id]: e.target.value})} className="w-24 border border-slate-200 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 text-center font-bold" />
                                      <button onClick={() => handleGradeSubmission(sub.id)} className="px-4 py-2 bg-slate-900 text-white font-bold text-sm rounded-lg hover:bg-slate-800 transition-all active:scale-95">Save</button>
                                    </>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE MODALS (Course / Assignment) */}
      {showAssignmentModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center"><h3 className="text-xl font-bold text-slate-900">New Assignment</h3><button onClick={() => setShowAssignmentModal(false)} className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors font-bold">&times;</button></div>
            <form onSubmit={handleCreateAssignment} className="p-8 space-y-5">
              <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Title</label><input type="text" required value={assignTitle} onChange={(e) => setAssignTitle(e.target.value)} className="w-full bg-slate-50 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Instructions</label><textarea required rows={3} value={assignDesc} onChange={(e) => setAssignDesc(e.target.value)} className="w-full bg-slate-50 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500"></textarea></div>
              <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Due Date</label><input type="datetime-local" required value={assignDue} onChange={(e) => setAssignDue(e.target.value)} className="w-full bg-slate-50 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 text-slate-700" /></div>
              <div className="flex gap-3 mt-8"><button type="button" onClick={() => setShowAssignmentModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors">Cancel</button><button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-600/30">Post</button></div>
            </form>
          </div>
        </div>
      )}

      {showCourseModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center"><h3 className="text-xl font-bold text-slate-900">Create Module</h3><button onClick={() => setShowCourseModal(false)} className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors font-bold">&times;</button></div>
            <form onSubmit={handleCreateCourse} className="p-8 space-y-5">
              <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Course Code</label><input type="text" placeholder="e.g. SENG1222" required value={newCourseCode} onChange={(e) => setNewCourseCode(e.target.value)} className="w-full bg-slate-50 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 uppercase font-mono" /></div>
              <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Course Title</label><input type="text" required value={newCourseTitle} onChange={(e) => setNewCourseTitle(e.target.value)} className="w-full bg-slate-50 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500" /></div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Assign Lecturer</label>
                <select required value={newCourseLecturerId} onChange={(e) => setNewCourseLecturerId(e.target.value)} className="w-full bg-slate-50 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-700 cursor-pointer">
                  <option value="" disabled>Select faculty...</option>
                  {lecturers.map(l => <option key={l.id} value={l.id}>Dr. {l.lastName} ({l.firstName})</option>)}
                </select>
              </div>
              <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Description</label><textarea rows={3} value={newCourseDesc} onChange={(e) => setNewCourseDesc(e.target.value)} className="w-full bg-slate-50 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500"></textarea></div>
              <div className="flex gap-3 mt-8"><button type="button" onClick={() => setShowCourseModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors">Cancel</button><button type="submit" disabled={isCreatingCourse} className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50">Launch Course</button></div>
            </form>
          </div>
        </div>
      )}

      {/* --- HEADER --- */}
      <header className="flex justify-between items-center mb-10 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-600/20"><span className="text-white font-bold">E</span></div>
             <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">EduFlow</h1>
          </div>
          <div className="flex gap-8 mt-8">
            {userRole !== 'STUDENT' && (<button onClick={() => setCurrentView('students')} className={`pb-3 font-bold text-sm border-b-2 transition-all ${currentView === 'students' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>Student Analytics</button>)}
            <button onClick={() => setCurrentView('courses')} className={`pb-3 font-bold text-sm border-b-2 transition-all ${currentView === 'courses' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>Course Management</button>
          </div>
        </div>
        
        {/* --- PREMIUM USER MENU --- */}
        <div className="relative">
          <button 
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 p-1.5 pr-4 bg-white border border-slate-200 rounded-full hover:shadow-md transition-all outline-none"
          >
            <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
               {userFirstName?.[0]}{userLastName?.[0]}
            </div>
            <div className="text-left hidden sm:block">
              <span className="block text-xs font-bold text-slate-900 uppercase tracking-wide">{userRole}</span>
            </div>
            <svg className={`w-4 h-4 text-slate-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </button>

          {showUserMenu && (
            <>
              {/* Invisible overlay to close menu when clicking outside */}
              <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)}></div>
              
              <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden transform animate-slide-in-down">
                <div className="p-5 bg-slate-50 border-b border-slate-100">
                  <p className="font-bold text-slate-900 truncate">{userFirstName} {userLastName}</p>
                  <p className="text-sm text-slate-500 truncate">{userEmail}</p>
                </div>
                <div className="p-2">
                  {userRole === 'STUDENT' && (
                    <button onClick={openEditProfileModal} className="w-full text-left px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-xl transition-colors">⚙️ Manage Academic Profile</button>
                  )}
                  <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors mt-1">🚪 Sign Out</button>
                </div>
              </div>
            </>
          )}
        </div>
      </header>

      {/* --- DASHBOARD VIEWS --- */}
      {currentView === 'students' && userRole !== 'STUDENT' && (
        <section className="animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 hover:shadow-lg transition-shadow">
              <h3 className="text-lg font-extrabold text-slate-900 mb-1">Dropout Risk Distribution</h3>
              <p className="text-sm text-slate-500 mb-6">AI cohort analysis.</p>
              <div className="h-64 w-full">
                {isLoading ? <div className="flex h-full items-center justify-center text-slate-400 font-medium">Loading...</div> : pieData.length === 0 ? <div className="flex h-full items-center justify-center text-slate-400 font-medium">No data</div> : (
                  <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={65} outerRadius={85} paddingAngle={5} dataKey="value">{pieData.map((e, i) => <Cell key={`cell-${i}`} fill={e.color} />)}</Pie><RechartsTooltip contentStyle={{borderRadius:'12px', border:'none', boxShadow:'0 10px 15px -3px rgb(0 0 0 / 0.1)'}}/><Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize:'12px', fontWeight:'600'}}/></PieChart></ResponsiveContainer>
                )}
              </div>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 hover:shadow-lg transition-shadow">
              <h3 className="text-lg font-extrabold text-slate-900 mb-1">Academic Performance</h3>
              <p className="text-sm text-slate-500 mb-6">Average grades snapshot.</p>
              <div className="h-64 w-full">
                {isLoading ? <div className="flex h-full items-center justify-center text-slate-400 font-medium">Loading...</div> : barData.length === 0 ? <div className="flex h-full items-center justify-center text-slate-400 font-medium">No data</div> : (
                  <ResponsiveContainer width="100%" height="100%"><BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b', fontWeight: 600}} /><YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b', fontWeight: 600}} domain={[0, 20]} /><RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} /><Bar dataKey="Grade" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={32} /></BarChart></ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="p-6 border-b border-slate-100 bg-slate-50/50"><h2 className="text-lg font-extrabold text-slate-900">Detailed Student Roster</h2></div>
             <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-white border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-widest">
                      <th className="p-5">Student</th><th className="p-5 text-center">Age</th><th className="p-5 text-center">Admission</th><th className="p-5 text-center">Tuition Paid</th><th className="p-5 text-center">Scholarship</th><th className="p-5 text-center">In Debt</th><th className="p-5 text-center">Passed</th><th className="p-5 text-center text-blue-600 bg-blue-50/30">Avg Grade</th><th className="p-5">AI Prediction</th><th className="p-5">Confidence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {students.map((student: any) => {
                      const predictionRec = student.aiPredictions?.[0]; const hasProf = !!student.profile;
                      return (
                        <tr key={student.id} className="hover:bg-slate-50 transition-colors text-sm group">
                          <td className="p-5"><div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{student.firstName} {student.lastName}</div><div className="text-xs text-slate-400 font-mono mt-0.5">#{student.id.substring(0, 8)}</div></td>
                          <td className="p-5 text-center font-medium text-slate-600">{hasProf ? student.profile.ageAtEnrollment : '-'}</td>
                          <td className="p-5 text-center font-medium text-slate-600">{hasProf ? student.profile.admissionGrade : '-'}</td>
                          <td className="p-5 text-center">{hasProf ? (student.profile.tuitionUpToDate ? <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span> : <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>) : '-'}</td>
                          <td className="p-5 text-center">{hasProf ? (student.profile.scholarship ? <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span> : <span className="w-2 h-2 rounded-full bg-slate-300 inline-block"></span>) : '-'}</td>
                          <td className="p-5 text-center">{hasProf ? (student.profile.debtor ? <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span> : <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>) : '-'}</td>
                          <td className="p-5 text-center font-bold text-slate-800">{hasProf ? student.profile.classesPassed : '-'}</td>
                          <td className="p-5 text-center font-black text-blue-600 bg-blue-50/30 text-base">{hasProf ? student.profile.grades1stSem : '-'}</td>
                          <td className="p-5">
                            {predictionRec ? (
                               <span className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider ${predictionRec.prediction === 'Graduate' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{predictionRec.prediction}</span>
                            ) : <span className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 border border-slate-200 bg-slate-50">{hasProf ? "Pending" : "No Data"}</span>}
                          </td>
                          <td className="p-5 font-bold text-slate-700">{predictionRec?.confidence ? `${predictionRec.confidence}%` : '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
               </table>
             </div>
          </div>
        </section>
      )}

      {currentView === 'courses' && (
        <section className="animate-fade-in">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Active Modules</h2>
            {userRole === 'ADMIN' && (<button onClick={() => setShowCourseModal(true)} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all hover:shadow-lg hover:-translate-y-0.5 active:scale-95">+ New Course</button>)}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {courses.length === 0 ? <p className="text-slate-500 font-medium p-4">No modules found.</p> : courses.map((course: any) => {
              const isEnrolled = course.enrollments?.some((e: any) => e.studentId === userId);
              return (
                <div key={course.id} onClick={() => setSelectedCourse(course)} className="group bg-white p-8 rounded-3xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-blue-200 transition-all cursor-pointer transform hover:-translate-y-1 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-6"><span className="px-3 py-1.5 bg-slate-100 group-hover:bg-blue-50 text-slate-700 group-hover:text-blue-700 text-xs font-bold rounded-lg tracking-wider transition-colors">{course.courseCode}</span><span className="flex items-center gap-1.5 text-xs font-bold text-slate-400 group-hover:text-slate-600 transition-colors"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"></path></svg>{course.enrollments?.length || 0}</span></div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">{course.title}</h3>
                  <p className="text-sm text-slate-500 mb-8 leading-relaxed flex-grow line-clamp-3">{course.description}</p>
                  <div className="pt-6 border-t border-slate-100 flex justify-between items-center mt-auto">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-xs font-bold text-slate-700">{course.lecturer?.firstName?.[0]}{course.lecturer?.lastName?.[0]}</div>
                      <span className="text-sm font-bold text-slate-700">Dr. {course.lecturer?.lastName}</span>
                    </div>
                    {userRole === 'STUDENT' && (isEnrolled ? <button disabled className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-sm font-bold cursor-default flex items-center gap-1.5"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>Enrolled</button> : <button onClick={(e) => { e.stopPropagation(); setEnrollCourse(course); }} className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all hover:shadow-lg shadow-blue-600/30 active:scale-95">Enroll</button>)}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}