"use client"; 

import React, { useState, useEffect } from 'react';

export default function EduFlowDashboard() {
  
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);

  
  const [age, setAge] = useState(20);
  const [tuition, setTuition] = useState(1);
  const [scholarship, setScholarship] = useState(0);
  const [grades, setGrades] = useState(13.5);
  const [admissionGrade, setAdmissionGrade] = useState(127.0);
  const [classesPassed, setClassesPassed] = useState(6);
  const [debtor, setDebtor] = useState(0);

  
  
  const fetchStudents = async () => {
    try {
      const res = await fetch('http://127.0.0.1:4000/api/students');
      const data = await res.json();
      setStudents(data);
    } catch (error) {
      console.error("Failed to fetch database:", error);
    } finally {
      setIsLoading(false);
    }
  };

  
  useEffect(() => {
    fetchStudents();
  }, []);

  
  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSimulating(true);

    try {
      // Step A: Save the raw student data to the Core API (PostgreSQL)
      // Because FastAPI expects these as query parameters in our setup:
      // Pass the new variables to the backend
      const createUrl = `http://127.0.0.1:4000/api/students?age=${age}&tuition_up_to_date=${tuition}&scholarship=${scholarship}&grades=${grades}&admission_grade=${admissionGrade}&classes_passed=${classesPassed}&debtor=${debtor}`;
      // Step A: Save the raw student data to the Core API using a secure JSON body
      const createRes = await fetch('http://127.0.0.1:4000/api/students', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          age: age,
          tuition_up_to_date: tuition,
          scholarship: scholarship,
          grades_1st_sem: grades,
          admission_grade: admissionGrade,
          classes_passed: classesPassed,
          debtor: debtor
        })
      });

      if (!createRes.ok) {
        // If Pydantic catches bad data, it throws an error before hitting the database!
        const errorData = await createRes.json();
        alert(`Data Validation Error: Please check your inputs.\n\nBackend says: ${JSON.stringify(errorData.detail)}`);
        setIsSimulating(false);
        return; // Stop the simulation
      }

      const newStudentData = await createRes.json();
      const newStudentId = newStudentData.student.id;
      // Step B: Tell the Core API to trigger the ML Engine!
      const analyzeUrl = `http://127.0.0.1:4000/api/students/${newStudentId}/analyze`;
      await fetch(analyzeUrl, { method: 'POST' });

      // Step C: Refresh the table to show the new AI results instantly
      await fetchStudents();

    } catch (error) {
      console.error("Simulation failed:", error);
      alert("Simulation failed. Check if your backend servers are running!");
    } finally {
      setIsSimulating(false);
    }
  };

  
  return (
    <main className="min-h-screen bg-gray-50 p-8 font-sans text-slate-800 flex gap-8">
      
      {/* LEFT COLUMN: The "What-If" Simulator Form */}
      <aside className="w-1/3 bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
        <h2 className="text-xl font-bold tracking-tight text-slate-900 mb-1">AI Simulator</h2>
        <p className="text-sm text-slate-500 mb-6">Test student metrics against the ML model.</p>

        <form onSubmit={handleSimulate} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Age at Enrollment</label>
            <input 
              type="number" 
              value={age} 
              onChange={(e) => setAge(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" 
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">1st Semester Grades (0-20)</label>
            <input 
              type="number" step="0.1" 
              value={grades} 
              onChange={(e) => setGrades(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Admission Score (0-200)</label>
              <input 
                type="number" step="0.1" 
                value={admissionGrade} 
                onChange={(e) => setAdmissionGrade(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Classes Passed (Out of 6)</label>
              <input 
                type="number" 
                value={classesPassed} 
                onChange={(e) => setClassesPassed(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Tuition Paid?</label>
              <select 
                value={tuition} 
                onChange={(e) => setTuition(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value={1}>Yes (Paid)</option>
                <option value={0}>No (Debt)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Scholarship?</label>
              <select 
                value={scholarship} 
                onChange={(e) => setScholarship(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value={1}>Yes</option>
                <option value={0}>No</option>
              </select>
            </div>
            <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Other Debt?</label>
            <select 
              value={debtor} 
              onChange={(e) => setDebtor(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value={1}>Yes (Owes Money)</option>
              <option value={0}>No (Clear)</option>
            </select>
          </div>
          </div>

          <button 
            type="submit" 
            disabled={isSimulating}
            className="w-full mt-4 bg-slate-900 text-white font-bold py-3 rounded-lg hover:bg-slate-800 transition-colors disabled:bg-slate-400"
          >
            {isSimulating ? "Running AI Engine..." : "Simulate & Save"}
          </button>
        </form>
      </aside>

      {/* RIGHT COLUMN: The Analytics Data Table */}
      <section className="w-2/3">
        <header className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">EduFlow Database</h1>
          <p className="text-slate-500 mt-1">Live tracking of all enrolled students.</p>
        </header>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100/50 border-b border-gray-200 text-sm font-semibold text-slate-600">
                <th className="p-4">ID</th>
                <th className="p-4">Age</th>
                <th className="p-4">Grades</th>
                <th className="p-4">AI Prediction</th>
                <th className="p-4">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              
              {isLoading ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-500">Loading database...</td></tr>
              ) : students.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-500">No students yet. Run a simulation!</td></tr>
              ) : (
                students.map((student: any) => (
                  <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-medium">#{student.id}</td>
                    <td className="p-4 text-slate-600">{student.age}</td>
                    <td className="p-4 text-slate-600">{student.grades_1st_sem}</td>
                    
                    {/* The Dynamic AI Badge */}
                    <td className="p-4">
                      {student.ml_prediction ? (
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                          ${student.ml_prediction === 'Graduate' ? 'bg-emerald-100 text-emerald-700' : ''}
                          ${student.ml_prediction === 'Enrolled' ? 'bg-amber-100 text-amber-700' : ''}
                          ${student.ml_prediction === 'Dropout' ? 'bg-rose-100 text-rose-700' : ''}
                        `}>
                          {student.ml_prediction}
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">Pending</span>
                      )}
                    </td>
                    <td className="p-4 text-sm font-semibold text-slate-700">
                      {student.ml_confidence ? `${student.ml_confidence}%` : '-'}
                    </td>
                  </tr>
                ))
              )}

            </tbody>
          </table>
        </div>
      </section>

    </main>
  );
}