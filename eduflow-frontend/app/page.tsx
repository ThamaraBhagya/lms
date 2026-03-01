"use client"; 

import React, { useState, useEffect } from 'react';

export default function EduFlowDashboard() {
  // Auth State
  const [token, setToken] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null); // --- NEW: Track the exact user ID ---
  
  const [loginEmail, setLoginEmail] = useState("test@eduflow.local");
  const [loginPassword, setLoginPassword] = useState("supersecretpassword123");
  const [authError, setAuthError] = useState("");

  const [currentView, setCurrentView] = useState<'students' | 'courses'>('courses');

  const [students, setStudents] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);

  const [age, setAge] = useState(20);
  const [tuition, setTuition] = useState(1);
  const [scholarship, setScholarship] = useState(0);
  const [grades, setGrades] = useState(13.5);
  const [admissionGrade, setAdmissionGrade] = useState(127.0);
  const [classesPassed, setClassesPassed] = useState(6);
  const [debtor, setDebtor] = useState(0);

  const [showCourseModal, setShowCourseModal] = useState(false);
  const [newCourseCode, setNewCourseCode] = useState("");
  const [newCourseTitle, setNewCourseTitle] = useState("");
  const [newCourseDesc, setNewCourseDesc] = useState("");
  const [isCreatingCourse, setIsCreatingCourse] = useState(false);

  useEffect(() => {
    const savedToken = localStorage.getItem("eduflow_token");
    const savedRole = localStorage.getItem("eduflow_role");
    const savedUserId = localStorage.getItem("eduflow_userId"); // Load the ID!
    
    if (savedToken) setToken(savedToken);
    if (savedRole) setUserRole(savedRole);
    if (savedUserId) setUserId(savedUserId);
  }, []);

  useEffect(() => {
    if (token) {
      if (userRole !== 'STUDENT') fetchStudents();
      fetchCourses();
    }
  }, [token, userRole]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    try {
      const formData = new URLSearchParams();
      formData.append("username", loginEmail);
      formData.append("password", loginPassword);

      const res = await fetch('http://127.0.0.1:4000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData
      });

      if (!res.ok) throw new Error("Invalid credentials");
      const data = await res.json();
      
      localStorage.setItem("eduflow_token", data.access_token);
      localStorage.setItem("eduflow_role", data.user.role);
      localStorage.setItem("eduflow_userId", data.user.id); // Save the ID!
      
      setToken(data.access_token);
      setUserRole(data.user.role);
      setUserId(data.user.id);
      
      if (data.user.role === 'STUDENT') setCurrentView('courses');
      else setCurrentView('students');

    } catch (err) {
      setAuthError("Failed to log in. Check your email and password.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("eduflow_token");
    localStorage.removeItem("eduflow_role");
    localStorage.removeItem("eduflow_userId");
    setToken(null);
    setUserRole(null);
    setUserId(null);
    setStudents([]);
    setCourses([]);
  };

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:4000/api/students', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) return handleLogout();
      const data = await res.json();
      setStudents(data);
    } catch (error) {
      console.error("Failed to fetch students:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await fetch('http://127.0.0.1:4000/api/courses', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCourses(data);
      }
    } catch (error) {
      console.error("Failed to fetch courses:", error);
    }
  };

  // --- NEW: Handle Course Enrollment ---
  const handleEnroll = async (courseId: string) => {
    try {
      const res = await fetch(`http://127.0.0.1:4000/api/courses/${courseId}/enroll`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to enroll");
      }

      // Immediately refresh the courses to show the updated enrollment count and change the button state!
      await fetchCourses();
      
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSimulating(true);
    try {
      const createRes = await fetch('http://127.0.0.1:4000/api/students', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ageAtEnrollment: age, tuitionUpToDate: tuition, scholarship: scholarship, grades1stSem: grades, admissionGrade: admissionGrade, classesPassed: classesPassed, debtor: debtor })
      });

      if (!createRes.ok) throw new Error("Validation or Auth Error");
      const newStudentData = await createRes.json();
      const newStudentId = newStudentData.student_id; 

      await fetch(`http://127.0.0.1:4000/api/students/${newStudentId}/analyze`, { 
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      await fetchStudents();
    } catch (error) {
      console.error("Simulation failed:", error);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingCourse(true);
    try {
      const res = await fetch('http://127.0.0.1:4000/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          courseCode: newCourseCode,
          title: newCourseTitle,
          description: newCourseDesc
        })
      });

      if (!res.ok) {
        const err = await res.json();
        alert(`Failed to create course: ${err.detail}`);
        throw new Error(err.detail);
      }

      await fetchCourses();
      setShowCourseModal(false);
      setNewCourseCode("");
      setNewCourseTitle("");
      setNewCourseDesc("");
    } catch (error) {
      console.error(error);
    } finally {
      setIsCreatingCourse(false);
    }
  };

  if (!token) {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
        <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md border border-gray-200">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900">EduFlow</h1>
            <p className="text-slate-500 mt-2">Sign in to access the LMS Dashboard</p>
          </div>
          {authError && <div className="bg-rose-50 text-rose-600 p-3 rounded-lg text-sm mb-4 text-center">{authError}</div>}
          <form onSubmit={handleLogin} className="space-y-4">
            <div><label className="block text-sm font-semibold text-slate-700 mb-1">Email</label><input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none" required /></div>
            <div><label className="block text-sm font-semibold text-slate-700 mb-1">Password</label><input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none" required /></div>
            <button type="submit" className="w-full mt-4 bg-slate-900 text-white font-bold py-3 rounded-lg hover:bg-slate-800 transition-colors">Sign In</button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8 font-sans text-slate-800 relative">
      
      {showCourseModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">Create New Course</h3>
              <button onClick={() => setShowCourseModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">&times;</button>
            </div>
            <form onSubmit={handleCreateCourse} className="p-6 space-y-4">
              <div><label className="block text-sm font-semibold text-slate-700 mb-1">Course Code</label><input type="text" placeholder="e.g., SENG1222" required value={newCourseCode} onChange={(e) => setNewCourseCode(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none uppercase" /></div>
              <div><label className="block text-sm font-semibold text-slate-700 mb-1">Course Title</label><input type="text" placeholder="e.g., Database Management Systems" required value={newCourseTitle} onChange={(e) => setNewCourseTitle(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" /></div>
              <div><label className="block text-sm font-semibold text-slate-700 mb-1">Description</label><textarea placeholder="Brief overview of the module..." rows={3} value={newCourseDesc} onChange={(e) => setNewCourseDesc(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"></textarea></div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setShowCourseModal(false)} className="flex-1 py-2 bg-gray-100 text-slate-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors">Cancel</button>
                <button type="submit" disabled={isCreatingCourse} className="flex-1 py-2 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition-colors disabled:bg-slate-400">{isCreatingCourse ? "Creating..." : "Save Course"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <header className="flex justify-between items-end mb-8 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">EduFlow Platform</h1>
          <div className="flex gap-6 mt-6">
            {userRole !== 'STUDENT' && (
              <button onClick={() => setCurrentView('students')} className={`pb-2 font-semibold text-sm border-b-2 transition-colors ${currentView === 'students' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Student Analytics</button>
            )}
            <button onClick={() => setCurrentView('courses')} className={`pb-2 font-semibold text-sm border-b-2 transition-colors ${currentView === 'courses' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Course Management</button>
          </div>
        </div>
        <div className="flex items-center gap-4 mb-2">
          <span className="px-3 py-1 bg-slate-200 text-slate-700 text-xs font-bold rounded-full uppercase">{userRole}</span>
          <button onClick={handleLogout} className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-semibold transition-colors">Sign Out</button>
        </div>
      </header>

      {/* VIEW: STUDENT ANALYTICS */}
      {currentView === 'students' && userRole !== 'STUDENT' && (
        <div className="flex gap-8">
           {/* ... (Unchanged Simulator Form) ... */}
           <aside className="w-1/3 bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 mb-1">AI Simulator</h2>
            <p className="text-sm text-slate-500 mb-6">Test metrics against the ML model.</p>
            <form onSubmit={handleSimulate} className="space-y-4">
              <div><label className="block text-sm font-semibold text-slate-700 mb-1">Age at Enrollment</label><input type="number" value={age} onChange={(e) => setAge(Number(e.target.value))} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" /></div>
              <div><label className="block text-sm font-semibold text-slate-700 mb-1">1st Semester Grades (0-20)</label><input type="number" step="0.1" value={grades} onChange={(e) => setGrades(Number(e.target.value))} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-semibold text-slate-700 mb-1">Admission Score (0-200)</label><input type="number" step="0.1" value={admissionGrade} onChange={(e) => setAdmissionGrade(Number(e.target.value))} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" /></div>
                <div><label className="block text-sm font-semibold text-slate-700 mb-1">Classes Passed (Out of 6)</label><input type="number" value={classesPassed} onChange={(e) => setClassesPassed(Number(e.target.value))} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-semibold text-slate-700 mb-1">Tuition Paid?</label><select value={tuition} onChange={(e) => setTuition(Number(e.target.value))} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"><option value={1}>Yes (Paid)</option><option value={0}>No (Debt)</option></select></div>
                <div><label className="block text-sm font-semibold text-slate-700 mb-1">Scholarship?</label><select value={scholarship} onChange={(e) => setScholarship(Number(e.target.value))} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"><option value={1}>Yes</option><option value={0}>No</option></select></div>
                <div><label className="block text-sm font-semibold text-slate-700 mb-1">Other Debt?</label><select value={debtor} onChange={(e) => setDebtor(Number(e.target.value))} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"><option value={1}>Yes (Owes Money)</option><option value={0}>No (Clear)</option></select></div>
              </div>
              <button type="submit" disabled={isSimulating} className="w-full mt-4 bg-slate-900 text-white font-bold py-3 rounded-lg hover:bg-slate-800 transition-colors disabled:bg-slate-400">
                {isSimulating ? "Running AI Engine..." : "Simulate & Save"}
              </button>
            </form>
          </aside>

          <section className="w-2/3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100/50 border-b border-gray-200 text-sm font-semibold text-slate-600">
                    <th className="p-4">ID</th><th className="p-4">Age</th><th className="p-4">Grades</th><th className="p-4">AI Prediction</th><th className="p-4">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {isLoading ? <tr><td colSpan={5} className="p-8 text-center text-slate-500">Loading database...</td></tr> : students.length === 0 ? <tr><td colSpan={5} className="p-8 text-center text-slate-500">No students yet.</td></tr> : students.map((student: any) => {
                    const predictionRec = student.aiPredictions && student.aiPredictions.length > 0 ? student.aiPredictions[0] : null;
                    const predictionText = predictionRec ? predictionRec.prediction.toUpperCase() : null;
                    return (
                      <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4 font-medium uppercase">#{student.id.substring(0, 8)}</td>
                        <td className="p-4 text-slate-600">{student.profile?.ageAtEnrollment || '-'}</td>
                        <td className="p-4 text-slate-600">{student.profile?.grades1stSem || '-'}</td>
                        <td className="p-4">
                          {predictionText ? (
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${predictionText === 'GRADUATE' ? 'bg-emerald-100 text-emerald-700' : ''} ${predictionText === 'ENROLLED' ? 'bg-amber-100 text-amber-700' : ''} ${predictionText === 'DROPOUT' ? 'bg-rose-100 text-rose-700' : ''}`}>
                              {predictionText}
                            </span>
                          ) : <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">Pending</span>}
                        </td>
                        <td className="p-4 text-sm font-semibold text-slate-700">{predictionRec?.confidence ? `${predictionRec.confidence}%` : '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* VIEW: COURSE MANAGEMENT */}
      {currentView === 'courses' && (
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Active Modules</h2>
            {userRole !== 'STUDENT' && (
              <button onClick={() => setShowCourseModal(true)} className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-sm font-semibold transition-colors">
                + New Course
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.length === 0 ? (
              <p className="text-slate-500">No courses available.</p>
            ) : (
              courses.map((course: any) => {
                
                // --- NEW: Check if this specific user is already enrolled ---
                const isEnrolled = course.enrollments?.some((e: any) => e.studentId === userId);

                return (
                  <div key={course.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex justify-between items-start mb-4">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                        {course.courseCode}
                      </span>
                      <span className="text-xs font-medium text-slate-500">
                        {course.enrollments?.length || 0} Students
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">{course.title}</h3>
                    <p className="text-sm text-slate-600 line-clamp-2 mb-4">
                      {course.description}
                    </p>
                    <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 uppercase">
                          {course.lecturer?.firstName?.[0]}{course.lecturer?.lastName?.[0]}
                        </div>
                        <span className="text-sm font-medium text-slate-700">
                          Prof. {course.lecturer?.lastName}
                        </span>
                      </div>

                      {/* --- UPDATED: Smart Enroll Button --- */}
                      {userRole === 'STUDENT' && (
                        isEnrolled ? (
                          <button disabled className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-md text-sm font-bold border border-emerald-200 cursor-default">
                            Enrolled ✓
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleEnroll(course.id)} 
                            className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md text-sm font-bold hover:bg-blue-100 transition-colors"
                          >
                            Enroll
                          </button>
                        )
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      )}

    </main>
  );
}