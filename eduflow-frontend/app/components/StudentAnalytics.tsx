import React from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

export default function StudentAnalytics({ students, isLoading, pieData, barData }: any) {
  return (
    <div className="animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 hover:shadow-lg transition-shadow">
          <h3 className="text-lg font-extrabold text-slate-900 mb-1">Dropout Risk Distribution</h3>
          <p className="text-sm text-slate-500 mb-6">AI cohort analysis.</p>
          <div className="h-64 w-full">
            {isLoading ? <div className="flex h-full items-center justify-center text-slate-400 font-medium">Loading...</div> : pieData.length === 0 ? <div className="flex h-full items-center justify-center text-slate-400 font-medium">No data</div> : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={65} outerRadius={85} paddingAngle={5} dataKey="value">
                    {pieData.map((e: any, i: number) => <Cell key={`cell-${i}`} fill={e.color} />)}
                  </Pie>
                  <RechartsTooltip contentStyle={{borderRadius:'12px', border:'none', boxShadow:'0 10px 15px -3px rgb(0 0 0 / 0.1)'}}/>
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize:'12px', fontWeight:'600'}}/>
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 hover:shadow-lg transition-shadow">
          <h3 className="text-lg font-extrabold text-slate-900 mb-1">Academic Performance</h3>
          <p className="text-sm text-slate-500 mb-6">Average grades snapshot.</p>
          <div className="h-64 w-full">
            {isLoading ? <div className="flex h-full items-center justify-center text-slate-400 font-medium">Loading...</div> : barData.length === 0 ? <div className="flex h-full items-center justify-center text-slate-400 font-medium">No data</div> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b', fontWeight: 600}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b', fontWeight: 600}} domain={[0, 20]} />
                  <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                  <Bar dataKey="Grade" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
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
    </div>
  );
}