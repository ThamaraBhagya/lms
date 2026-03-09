import React from 'react';

export default function CourseManagement({ primaryCourses, secondaryCourses, primaryTitle, secondaryTitle, userRole, userId, setShowCourseModal, setEnrollCourse, setSelectedCourse }: any) {
  
  const renderCourseGrid = (courseList: any[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 mb-12">
      {courseList.map((course: any) => {
        const isEnrolled = course.enrollments?.some((e: any) => e.studentId === userId);
        
        const handleCardClick = () => {
          if (userRole === 'STUDENT' && !isEnrolled) setEnrollCourse(course);
          else setSelectedCourse(course);
        };

        return (
          <div key={course.id} onClick={handleCardClick} className="group bg-white p-8 rounded-3xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-blue-200 transition-all cursor-pointer transform hover:-translate-y-1 flex flex-col h-full">
            <div className="flex justify-between items-start mb-6">
                <span className="px-3 py-1.5 bg-slate-100 group-hover:bg-blue-50 text-slate-700 group-hover:text-blue-700 text-xs font-bold rounded-lg tracking-wider transition-colors">{course.courseCode}</span>
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400 group-hover:text-slate-600 transition-colors"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"></path></svg>{course.enrollments?.length || 0}</span>
            </div>
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
  );

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">{primaryTitle}</h2>
        {userRole === 'ADMIN' && (<button onClick={() => setShowCourseModal(true)} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all hover:shadow-lg hover:-translate-y-0.5 active:scale-95">+ New Course</button>)}
      </div>
      {primaryCourses.length === 0 ? <p className="text-slate-500 font-medium p-4 mb-8">No modules found.</p> : renderCourseGrid(primaryCourses)}
      {secondaryCourses.length > 0 && (
        <>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 mb-6">{secondaryTitle}</h2>
          {renderCourseGrid(secondaryCourses)}
        </>
      )}
    </div>
  );
}