import React from 'react';

export function EnrollModal({ enrollCourse, enrollKey, setEnrollKey, handleConfirmEnroll, isEnrolling, setEnrollCourse }: any) {
  if (!enrollCourse) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden p-6 animate-fade-in">
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
  );
}

export function ProfileModal({ showProfileModal, setShowProfileModal, handleUpdateProfile, isUpdatingProfile, editState }: any) {
  if (!showProfileModal) return null;
  const { editAge, setEditAge, editTuition, setEditTuition, editScholarship, setEditScholarship, editDebtor, setEditDebtor } = editState;
  
  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 animate-fade-in">
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center"><h3 className="text-xl font-bold text-slate-900">Update Profile</h3><button onClick={() => setShowProfileModal(false)} className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 font-bold">&times;</button></div>
        <form onSubmit={handleUpdateProfile} className="p-8 space-y-5">
          <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Current Age</label><input type="number" value={editAge} onChange={(e) => setEditAge(Number(e.target.value))} className="w-full bg-slate-50 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500" required /></div>
          <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tuition Status</label><select value={editTuition} onChange={(e) => setEditTuition(Number(e.target.value))} className="w-full bg-slate-50 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500"><option value={1}>Up to Date</option><option value={0}>In Debt</option></select></div>
          <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Scholarship</label><select value={editScholarship} onChange={(e) => setEditScholarship(Number(e.target.value))} className="w-full bg-slate-50 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500"><option value={1}>Yes (Active)</option><option value={0}>No</option></select></div>
          <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Other Institutional Debt</label><select value={editDebtor} onChange={(e) => setEditDebtor(Number(e.target.value))} className="w-full bg-slate-50 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500"><option value={1}>Yes (Owes Money)</option><option value={0}>No (Clear)</option></select></div>
          <div className="flex gap-3 mt-8">
            <button type="button" onClick={() => setShowProfileModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors">Cancel</button>
            <button type="submit" disabled={isUpdatingProfile} className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 active:scale-95 disabled:opacity-50">Save & Analyze</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function CreateCourseModal({ showCourseModal, setShowCourseModal, handleCreateCourse, isCreatingCourse, lecturers, courseState }: any) {
  if (!showCourseModal) return null;
  const { newCourseCode, setNewCourseCode, newCourseTitle, setNewCourseTitle, newCourseDesc, setNewCourseDesc, newCourseLecturerId, setNewCourseLecturerId } = courseState;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 animate-fade-in">
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center"><h3 className="text-xl font-bold text-slate-900">Create Module</h3><button onClick={() => setShowCourseModal(false)} className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 font-bold">&times;</button></div>
        <form onSubmit={handleCreateCourse} className="p-8 space-y-5">
          <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Course Code</label><input type="text" placeholder="e.g. SENG1222" required value={newCourseCode} onChange={(e) => setNewCourseCode(e.target.value)} className="w-full bg-slate-50 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 uppercase font-mono" /></div>
          <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Course Title</label><input type="text" required value={newCourseTitle} onChange={(e) => setNewCourseTitle(e.target.value)} className="w-full bg-slate-50 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Assign Lecturer</label>
            <select required value={newCourseLecturerId} onChange={(e) => setNewCourseLecturerId(e.target.value)} className="w-full bg-slate-50 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-700 cursor-pointer">
              <option value="" disabled>Select faculty...</option>
              {lecturers.map((l: any) => <option key={l.id} value={l.id}>Dr. {l.lastName} ({l.firstName})</option>)}
            </select>
          </div>
          <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Description</label><textarea rows={3} value={newCourseDesc} onChange={(e) => setNewCourseDesc(e.target.value)} className="w-full bg-slate-50 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500"></textarea></div>
          <div className="flex gap-3 mt-8"><button type="button" onClick={() => setShowCourseModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200">Cancel</button><button type="submit" disabled={isCreatingCourse} className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 active:scale-95 disabled:opacity-50">Launch Course</button></div>
        </form>
      </div>
    </div>
  );
}

export function CreateAssignmentModal({ showAssignmentModal, setShowAssignmentModal, handleCreateAssignment, assignState }: any) {
  if (!showAssignmentModal) return null;
  const { assignTitle, setAssignTitle, assignDesc, setAssignDesc, assignDue, setAssignDue } = assignState;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 animate-fade-in">
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center"><h3 className="text-xl font-bold text-slate-900">New Assignment</h3><button onClick={() => setShowAssignmentModal(false)} className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 font-bold">&times;</button></div>
        <form onSubmit={handleCreateAssignment} className="p-8 space-y-5">
          <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Title</label><input type="text" required value={assignTitle} onChange={(e) => setAssignTitle(e.target.value)} className="w-full bg-slate-50 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Instructions</label><textarea required rows={3} value={assignDesc} onChange={(e) => setAssignDesc(e.target.value)} className="w-full bg-slate-50 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500"></textarea></div>
          <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Due Date</label><input type="datetime-local" required value={assignDue} onChange={(e) => setAssignDue(e.target.value)} className="w-full bg-slate-50 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 text-slate-700" /></div>
          <div className="flex gap-3 mt-8"><button type="button" onClick={() => setShowAssignmentModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200">Cancel</button><button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 active:scale-95 shadow-lg shadow-blue-600/30">Post</button></div>
        </form>
      </div>
    </div>
  );
}