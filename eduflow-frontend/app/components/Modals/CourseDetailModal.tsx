import React from 'react';

export default function CourseDetailModal({ selectedCourse, setSelectedCourse, userRole, userId, setShowAssignmentModal, subUrls, setSubUrls, handleSubmitWork, isSubmitting, gradeScores, setGradeScores, handleGradeSubmission, isGrading }: any) {
  if (!selectedCourse) return null;

  const isCourseOwner = userRole === 'ADMIN' || (userRole === 'LECTURER' && selectedCourse.lecturerId === userId);
  const isEnrolled = selectedCourse.enrollments?.some((e: any) => e.studentId === userId);

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-end z-40">
      <div className="bg-white w-full max-w-2xl h-full overflow-y-auto shadow-2xl p-10 transform transition-transform border-l border-slate-200 animate-slide-in-right">
        <div className="flex justify-between items-start mb-8">
          <div>
            <span className="px-3 py-1 bg-blue-50 text-blue-600 border border-blue-100 text-xs font-bold rounded-full mb-4 inline-block tracking-wider uppercase">{selectedCourse.courseCode}</span>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">{selectedCourse.title}</h2>
            <p className="text-slate-500 mt-3 leading-relaxed">{selectedCourse.description}</p>
          </div>
          <button onClick={() => setSelectedCourse(null)} className="w-10 h-10 flex items-center justify-center bg-slate-100 rounded-full hover:bg-slate-200 text-slate-500 transition-colors">&times;</button>
        </div>

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
        
        {userRole === 'STUDENT' && !isEnrolled ? (
          <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-8 text-center"><p className="text-slate-500 font-medium">🔒 You must enroll to view assignments.</p></div>
        ) : (!selectedCourse.assignments || selectedCourse.assignments.length === 0) ? (
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
                          <input type="url" placeholder="Paste link to your work" value={subUrls[assignment.id] || ""} onChange={(e) => setSubUrls({...subUrls, [assignment.id]: e.target.value})} className="flex-1 bg-slate-50 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none border border-slate-200" />
                          <button onClick={() => handleSubmitWork(assignment.id)} disabled={isSubmitting[assignment.id]} className="px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-50">
                            {isSubmitting[assignment.id] ? "Submitting..." : "Submit"}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {isCourseOwner && (
                    <div className="pt-5 border-t border-slate-100">
                      <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Student Submissions ({assignment.submissions?.length || 0})</h5>
                      {assignment.submissions?.map((sub: any) => {
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
                                  <button onClick={() => handleGradeSubmission(sub.id)} disabled={isGrading[sub.id]} className="px-4 py-2 bg-slate-900 text-white font-bold text-sm rounded-lg hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50">
                                    {isGrading[sub.id] ? "Saving..." : "Save"}
                                  </button>
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
  );
}