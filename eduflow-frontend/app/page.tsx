"use client"; 

import React, { useState, useEffect } from 'react';

export default function EduFlowDashboard() {
  // --- Auth State ---
  const [token, setToken] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  const [loginEmail, setLoginEmail] = useState("test@eduflow.local");
  const [loginPassword, setLoginPassword] = useState("supersecretpassword123");
  
  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRole, setRegRole] = useState("STUDENT");
  const [authError, setAuthError] = useState("");

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

  useEffect(() => {
    const savedToken = localStorage.getItem("eduflow_token");
    const savedRole = localStorage.getItem("eduflow_role");
    const savedUserId = localStorage.getItem("eduflow_userId"); 
    if (savedToken) setToken(savedToken);
    if (savedRole) setUserRole(savedRole);
    if (savedUserId) setUserId(savedUserId);
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
      if (!res.ok) throw new Error("Failed to onboard");
      setHasProfile(true);
    } catch (err) { alert("Error saving profile."); } finally { setIsOnboarding(false); }
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
      }
    } catch (err) { alert("Failed to load profile data."); }
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
      alert("Profile successfully updated! Your AI Prediction has been recalculated.");
      setShowProfileModal(false);
    } catch (err) { alert("Error updating profile."); } finally { setIsUpdatingProfile(false); }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
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
      setToken(data.access_token); setUserRole(data.user.role); setUserId(data.user.id);
      if (data.user.role === 'STUDENT') setCurrentView('courses');
      else setCurrentView('students');
    } catch (err) { setAuthError("Failed to log in."); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    try {
      const res = await fetch('http://127.0.0.1:4000/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName: regFirstName, lastName: regLastName, email: regEmail, password: regPassword, role: regRole })
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.detail || "Registration failed"); }
      setLoginEmail(regEmail); setRegPassword(""); setAuthMode('login');
      alert("Account created successfully! Please sign in.");
    } catch (err: any) { setAuthError(err.message); }
  };

  const handleLogout = () => {
    localStorage.clear();
    setToken(null); setUserRole(null); setUserId(null); setHasProfile(null);
    setStudents([]); setCourses([]); setSelectedCourse(null);
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
    if (!newCourseLecturerId) return alert("You must assign a lecturer to this course.");
    setIsCreatingCourse(true);
    try {
      const res = await fetch('http://127.0.0.1:4000/api/courses', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ courseCode: newCourseCode, title: newCourseTitle, description: newCourseDesc, lecturerId: newCourseLecturerId })
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.detail || "Failed"); }
      await fetchCourses(); setShowCourseModal(false);
      setNewCourseCode(""); setNewCourseTitle(""); setNewCourseDesc(""); setNewCourseLecturerId("");
    } catch (error: any) { alert(error.message); } finally { setIsCreatingCourse(false); }
  };

  const handleEnroll = async (e: React.MouseEvent, courseId: string) => {
    e.stopPropagation();
    try {
      const res = await fetch(`http://127.0.0.1:4000/api/courses/${courseId}/enroll`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) { const err = await res.json(); throw new Error(err.detail || "Failed to enroll"); }
      await fetchCourses();
    } catch (error: any) { alert(error.message); }
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
    } catch (error: any) { alert(error.message); }
  };

  const handleSubmitWork = async (assignmentId: string) => {
    if (!subUrl) return alert("Please enter a URL to submit.");
    try {
      const res = await fetch(`http://127.0.0.1:4000/api/assignments/${assignmentId}/submit`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ contentUrl: subUrl })
      });
      if (!res.ok) throw new Error("Failed to submit");
      setSubUrl(""); await fetchCourses(); alert("Work submitted successfully!");
    } catch (error) { alert("Error submitting work"); }
  };

  const handleGradeSubmission = async (submissionId: string) => {
    const scoreToSubmit = gradeScores[submissionId];
    if (!scoreToSubmit) return alert("Please enter a score.");
    try {
      const res = await fetch(`http://127.0.0.1:4000/api/submissions/${submissionId}/grade`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ score: Number(scoreToSubmit) })
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.detail || "Failed to grade"); }
      await fetchCourses();
      if (userRole !== 'STUDENT') await fetchStudents(); 
      alert("Grade saved and AI Prediction updated!");
    } catch (error: any) { alert(error.message); }
  };

  const isCourseOwner = selectedCourse && (userRole === 'ADMIN' || (userRole === 'LECTURER' && selectedCourse.lecturerId === userId));


  // =======================================
  // VIEW: AUTHENTICATION (Login / Register)
  // =======================================
  if (!token) {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
        <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md border border-gray-200">
          <div className="text-center mb-6"><h1 className="text-3xl font-bold text-slate-900">EduFlow</h1><p className="text-slate-500 mt-2">Access the Faculty LMS Dashboard</p></div>
          <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
            <button onClick={() => { setAuthMode('login'); setAuthError(""); }} className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${authMode === 'login' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>Sign In</button>
            <button onClick={() => { setAuthMode('register'); setAuthError(""); }} className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${authMode === 'register' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>Sign Up</button>
          </div>
          {authError && <div className="bg-rose-50 text-rose-600 p-3 rounded-lg text-sm mb-4 text-center">{authError}</div>}
          
          {authMode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div><label className="block text-sm font-semibold text-slate-700 mb-1">Email</label><input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none" required /></div>
              <div><label className="block text-sm font-semibold text-slate-700 mb-1">Password</label><input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none" required /></div>
              <button type="submit" className="w-full mt-4 bg-slate-900 text-white font-bold py-3 rounded-lg hover:bg-slate-800 transition-colors">Sign In</button>
            </form>
          )}

          {authMode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-semibold text-slate-700 mb-1">First Name</label><input type="text" value={regFirstName} onChange={(e) => setRegFirstName(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" required /></div>
                <div><label className="block text-sm font-semibold text-slate-700 mb-1">Last Name</label><input type="text" value={regLastName} onChange={(e) => setRegLastName(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" required /></div>
              </div>
              <div><label className="block text-sm font-semibold text-slate-700 mb-1">Email</label><input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" required /></div>
              <div><label className="block text-sm font-semibold text-slate-700 mb-1">Password</label><input type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" required minLength={6} /></div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Account Type</label>
                <select value={regRole} onChange={(e) => setRegRole(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="STUDENT">Student</option>
                  <option value="LECTURER">Lecturer</option>
                </select>
              </div>
              <button type="submit" className="w-full mt-4 bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors">Create Account</button>
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
      <main className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
        <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-lg border border-gray-200">
          <div className="text-center mb-8"><h1 className="text-3xl font-bold text-slate-900">Welcome to EduFlow</h1><p className="text-slate-500 mt-2">Please complete your academic profile to access courses.</p></div>
          <form onSubmit={submitOnboarding} className="space-y-4">
            <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-semibold text-slate-700 mb-1">Age</label><input type="number" value={onboardAge} onChange={(e) => setOnboardAge(Number(e.target.value))} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" required /></div><div><label className="block text-sm font-semibold text-slate-700 mb-1">Admission Score</label><input type="number" step="0.1" value={onboardAdmission} onChange={(e) => setOnboardAdmission(Number(e.target.value))} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" required /></div></div>
            <div><label className="block text-sm font-semibold text-slate-700 mb-1">Tuition Status</label><select value={onboardTuition} onChange={(e) => setOnboardTuition(Number(e.target.value))} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"><option value={1}>Up to Date</option><option value={0}>In Debt</option></select></div>
            <div><label className="block text-sm font-semibold text-slate-700 mb-1">Scholarship</label><select value={onboardScholarship} onChange={(e) => setOnboardScholarship(Number(e.target.value))} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"><option value={1}>Yes (Active)</option><option value={0}>No</option></select></div>
            <div><label className="block text-sm font-semibold text-slate-700 mb-1">Other Institutional Debt</label><select value={onboardDebtor} onChange={(e) => setOnboardDebtor(Number(e.target.value))} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"><option value={1}>Yes (Owes Money)</option><option value={0}>No (Clear)</option></select></div>
            <button type="submit" disabled={isOnboarding} className="w-full mt-6 bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400">{isOnboarding ? "Saving..." : "Complete Profile"}</button>
            <button type="button" onClick={handleLogout} className="w-full mt-2 text-slate-500 text-sm font-semibold hover:text-slate-800">Cancel & Sign Out</button>
          </form>
        </div>
      </main>
    );
  }

  // =======================================
  // VIEW: MAIN DASHBOARD
  // =======================================
  return (
    <main className="min-h-screen bg-gray-50 p-8 font-sans text-slate-800 relative">
      
      {/* EDIT PROFILE MODAL */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center"><h3 className="text-lg font-bold text-slate-900">Edit My Profile</h3><button onClick={() => setShowProfileModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">&times;</button></div>
            <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
              <div><label className="block text-sm font-semibold text-slate-700 mb-1">Age</label><input type="number" value={editAge} onChange={(e) => setEditAge(Number(e.target.value))} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" required /></div>
              <div><label className="block text-sm font-semibold text-slate-700 mb-1">Tuition Status</label><select value={editTuition} onChange={(e) => setEditTuition(Number(e.target.value))} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"><option value={1}>Up to Date</option><option value={0}>In Debt</option></select></div>
              <div><label className="block text-sm font-semibold text-slate-700 mb-1">Scholarship</label><select value={editScholarship} onChange={(e) => setEditScholarship(Number(e.target.value))} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"><option value={1}>Yes (Active)</option><option value={0}>No</option></select></div>
              <div><label className="block text-sm font-semibold text-slate-700 mb-1">Other Institutional Debt</label><select value={editDebtor} onChange={(e) => setEditDebtor(Number(e.target.value))} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"><option value={1}>Yes (Owes Money)</option><option value={0}>No (Clear)</option></select></div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setShowProfileModal(false)} className="flex-1 py-2 bg-gray-100 text-slate-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors">Cancel</button>
                <button type="submit" disabled={isUpdatingProfile} className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-blue-400">
                  {isUpdatingProfile ? "Updating..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COURSE DETAILS MODAL */}
      {selectedCourse && (
        <div className="fixed inset-0 bg-slate-900/50 flex justify-end z-40">
          <div className="bg-white w-full max-w-2xl h-full overflow-y-auto shadow-2xl p-8 transform transition-transform animate-slide-in-right">
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full mb-3 inline-block">{selectedCourse.courseCode}</span>
                <h2 className="text-3xl font-bold text-slate-900">{selectedCourse.title}</h2>
                <p className="text-slate-500 mt-2">{selectedCourse.description}</p>
              </div>
              <button onClick={() => setSelectedCourse(null)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-slate-500">&times;</button>
            </div>

            {isCourseOwner && (
               <div className="mb-8 border-b border-gray-100 pb-6">
                 <button onClick={() => setShowAssignmentModal(true)} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors">+ Create Assignment</button>
               </div>
            )}

            <h3 className="text-xl font-bold text-slate-900 mb-4">Course Assignments</h3>
            
            {(!selectedCourse.assignments || selectedCourse.assignments.length === 0) ? (
              <p className="text-slate-500 italic">No assignments posted yet.</p>
            ) : (
              <div className="space-y-6">
                {selectedCourse.assignments.map((assignment: any) => {
                  const mySubmission = assignment.submissions?.find((s: any) => s.studentId === userId);
                  return (
                    <div key={assignment.id} className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-lg font-bold text-slate-900">{assignment.title}</h4>
                        <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-1 rounded">Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-slate-600 mb-4">{assignment.description}</p>

                      {userRole === 'STUDENT' && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          {mySubmission ? (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-slate-500">Submitted: <a href={mySubmission.contentUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">View Work</a></span>
                              {mySubmission.score !== null ? (
                                <span className="font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-md">Grade: {mySubmission.score} / {assignment.maxScore}</span>
                              ) : (
                                <span className="font-medium text-amber-600 bg-amber-50 px-3 py-1 rounded-md">Grading Pending</span>
                              )}
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <input type="url" placeholder="Paste link to your work" value={subUrl} onChange={(e) => setSubUrl(e.target.value)} className="flex-1 border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                              <button onClick={() => handleSubmitWork(assignment.id)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">Submit</button>
                            </div>
                          )}
                        </div>
                      )}

                      {isCourseOwner && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <h5 className="text-sm font-bold text-slate-700 mb-3">Student Submissions ({assignment.submissions?.length || 0})</h5>
                          {assignment.submissions?.map((sub: any) => (
                            <div key={sub.id} className="flex items-center justify-between bg-white p-3 rounded border border-gray-100 mb-2 shadow-sm">
                              <div>
                                <span className="text-xs font-mono text-slate-500 block mb-1">Student ID: {sub.studentId.substring(0,8)}</span>
                                <a href={sub.contentUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-600 font-semibold hover:underline border-r pr-3 mr-3">View Work</a>
                                <span className="text-xs text-slate-500">Submitted: {new Date(sub.submittedAt).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {sub.score !== null ? (
                                  <span className="font-bold text-slate-800 mr-2">Score: {sub.score}/{assignment.maxScore}</span>
                                ) : (
                                  <>
                                    <input type="number" step="0.1" max="20" placeholder="0-20" value={gradeScores[sub.id] || ''} onChange={(e) => setGradeScores({...gradeScores, [sub.id]: e.target.value})} className="w-20 border border-gray-300 rounded p-1 text-sm outline-none text-center" />
                                    <button onClick={() => handleGradeSubmission(sub.id)} className="px-3 py-1 bg-emerald-100 text-emerald-700 font-bold text-sm rounded hover:bg-emerald-200">Grade</button>
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
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

      {/* CREATE ASSIGNMENT MODAL */}
      {showAssignmentModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center"><h3 className="text-lg font-bold text-slate-900">New Assignment for {selectedCourse?.courseCode}</h3><button onClick={() => setShowAssignmentModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">&times;</button></div>
            <form onSubmit={handleCreateAssignment} className="p-6 space-y-4">
              <div><label className="block text-sm font-semibold text-slate-700 mb-1">Title</label><input type="text" required value={assignTitle} onChange={(e) => setAssignTitle(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" /></div>
              <div><label className="block text-sm font-semibold text-slate-700 mb-1">Instructions</label><textarea required rows={3} value={assignDesc} onChange={(e) => setAssignDesc(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"></textarea></div>
              <div><label className="block text-sm font-semibold text-slate-700 mb-1">Due Date</label><input type="datetime-local" required value={assignDue} onChange={(e) => setAssignDue(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" /></div>
              <div className="flex gap-3 mt-6"><button type="button" onClick={() => setShowAssignmentModal(false)} className="flex-1 py-2 bg-gray-100 text-slate-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors">Cancel</button><button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">Post Assignment</button></div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE COURSE MODAL (Strictly ADMIN only) */}
      {showCourseModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center"><h3 className="text-lg font-bold text-slate-900">Create New Course</h3><button onClick={() => setShowCourseModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">&times;</button></div>
            <form onSubmit={handleCreateCourse} className="p-6 space-y-4">
              <div><label className="block text-sm font-semibold text-slate-700 mb-1">Course Code</label><input type="text" placeholder="e.g., SENG1222" required value={newCourseCode} onChange={(e) => setNewCourseCode(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none uppercase" /></div>
              <div><label className="block text-sm font-semibold text-slate-700 mb-1">Course Title</label><input type="text" placeholder="e.g., Database Management Systems" required value={newCourseTitle} onChange={(e) => setNewCourseTitle(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" /></div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Assign Lecturer</label>
                <select required value={newCourseLecturerId} onChange={(e) => setNewCourseLecturerId(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="" disabled>Select a faculty member...</option>
                  {lecturers.map(lecturer => (
                    <option key={lecturer.id} value={lecturer.id}>Dr. {lecturer.lastName} ({lecturer.firstName})</option>
                  ))}
                </select>
              </div>
              <div><label className="block text-sm font-semibold text-slate-700 mb-1">Description</label><textarea placeholder="Brief overview of the module..." rows={3} value={newCourseDesc} onChange={(e) => setNewCourseDesc(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"></textarea></div>
              <div className="flex gap-3 mt-6"><button type="button" onClick={() => setShowCourseModal(false)} className="flex-1 py-2 bg-gray-100 text-slate-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors">Cancel</button><button type="submit" disabled={isCreatingCourse} className="flex-1 py-2 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition-colors disabled:bg-slate-400">Save Course</button></div>
            </form>
          </div>
        </div>
      )}

      <header className="flex justify-between items-end mb-8 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">EduFlow Platform</h1>
          <div className="flex gap-6 mt-6">
            {userRole !== 'STUDENT' && (<button onClick={() => setCurrentView('students')} className={`pb-2 font-semibold text-sm border-b-2 transition-colors ${currentView === 'students' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Student Analytics</button>)}
            <button onClick={() => setCurrentView('courses')} className={`pb-2 font-semibold text-sm border-b-2 transition-colors ${currentView === 'courses' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Course Management</button>
          </div>
        </div>
        <div className="flex items-center gap-4 mb-2">
          {userRole === 'STUDENT' && (
             <button onClick={openEditProfileModal} className="px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-semibold rounded-md hover:bg-blue-100 transition-colors mr-2">
               Manage Profile
             </button>
          )}
          <span className="px-3 py-1 bg-slate-200 text-slate-700 text-xs font-bold rounded-full uppercase">{userRole}</span>
          <button onClick={handleLogout} className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-semibold transition-colors">Sign Out</button>
        </div>
      </header>

      {/* --- EXPANDED STUDENT ANALYTICS TABLE --- */}
      {currentView === 'students' && userRole !== 'STUDENT' && (
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Enrolled Students</h2>
            <p className="text-sm text-slate-500">Automated predictions based on comprehensive profile data.</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
             <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-gray-100/50 border-b border-gray-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    <th className="p-4">Student</th>
                    <th className="p-4 text-center">Age</th>
                    <th className="p-4 text-center">Admission</th>
                    <th className="p-4 text-center">Tuition Paid</th>
                    <th className="p-4 text-center">Scholarship</th>
                    <th className="p-4 text-center">In Debt</th>
                    <th className="p-4 text-center">Classes Passed</th>
                    <th className="p-4 text-center bg-blue-50">Avg Grade</th>
                    <th className="p-4">AI Prediction</th>
                    <th className="p-4">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {students.map((student: any) => {
                    const predictionRec = student.aiPredictions && student.aiPredictions.length > 0 ? student.aiPredictions[0] : null;
                    const hasProf = !!student.profile;
                    return (
                      <tr key={student.id} className="hover:bg-gray-50 transition-colors text-sm">
                        <td className="p-4">
                          <div className="font-semibold text-slate-900">{student.firstName} {student.lastName}</div>
                          <div className="text-xs text-slate-500">#{student.id.substring(0, 8)}</div>
                        </td>
                        <td className="p-4 text-center text-slate-600">{hasProf ? student.profile.ageAtEnrollment : '-'}</td>
                        <td className="p-4 text-center text-slate-600">{hasProf ? student.profile.admissionGrade : '-'}</td>
                        
                        <td className="p-4 text-center">
                          {hasProf ? (student.profile.tuitionUpToDate ? <span className="text-emerald-600 font-bold">Yes</span> : <span className="text-rose-600 font-bold">No</span>) : '-'}
                        </td>
                        <td className="p-4 text-center">
                          {hasProf ? (student.profile.scholarship ? <span className="text-emerald-600 font-bold">Yes</span> : <span className="text-slate-400">No</span>) : '-'}
                        </td>
                        <td className="p-4 text-center">
                          {hasProf ? (student.profile.debtor ? <span className="text-rose-600 font-bold">Yes</span> : <span className="text-emerald-600">No</span>) : '-'}
                        </td>

                        <td className="p-4 text-center font-medium text-slate-800">{hasProf ? student.profile.classesPassed : '-'}</td>
                        <td className="p-4 text-center font-bold text-blue-700 bg-blue-50/30">{hasProf ? student.profile.grades1stSem : '-'}</td>
                        
                        <td className="p-4">
                          {predictionRec ? (
                             <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${predictionRec.prediction === 'Graduate' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{predictionRec.prediction}</span>
                          ) : <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">{hasProf ? "Pending AI" : "Awaiting Profile"}</span>}
                        </td>
                        <td className="p-4 font-semibold text-slate-700">{predictionRec?.confidence ? `${predictionRec.confidence}%` : '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
             </table>
          </div>
        </section>
      )}

      {currentView === 'courses' && (
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Active Modules</h2>
            {userRole === 'ADMIN' && (<button onClick={() => setShowCourseModal(true)} className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-sm font-semibold transition-colors">+ New Course</button>)}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.length === 0 ? <p className="text-slate-500">No courses available.</p> : courses.map((course: any) => {
              const isEnrolled = course.enrollments?.some((e: any) => e.studentId === userId);
              return (
                <div key={course.id} onClick={() => setSelectedCourse(course)} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer transform hover:-translate-y-1">
                  <div className="flex justify-between items-start mb-4"><span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">{course.courseCode}</span><span className="text-xs font-medium text-slate-500">{course.enrollments?.length || 0} Students</span></div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{course.title}</h3>
                  <p className="text-sm text-slate-600 line-clamp-2 mb-4">{course.description}</p>
                  <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 uppercase">{course.lecturer?.firstName?.[0]}{course.lecturer?.lastName?.[0]}</div>
                      <span className="text-sm font-medium text-slate-700">Prof. {course.lecturer?.lastName}</span>
                    </div>
                    {userRole === 'STUDENT' && (isEnrolled ? <button disabled className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-md text-sm font-bold border border-emerald-200 cursor-default">Enrolled ✓</button> : <button onClick={(e) => handleEnroll(e, course.id)} className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md text-sm font-bold hover:bg-blue-100 transition-colors">Enroll</button>)}
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