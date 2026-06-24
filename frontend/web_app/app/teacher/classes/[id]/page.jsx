"use client";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import Navbar from "../../../../src/components/Navbar";
import Sidebar from "../../../../src/components/Sidebar";
import { getClasses, getEnrollments, getClassMarks, getUsers } from "../../../../src/services/api";

export default function ClassDetails({ params }) {
  const unwrappedParams = use(params);
  const classId = unwrappedParams.id;
  const [className, setClassName] = useState("");
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [studentMarks, setStudentMarks] = useState({});
  const [studentRemarks, setStudentRemarks] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [allClasses, allEnrollments, allMarks, allUsers] = await Promise.all([
          getClasses().catch(() => []),
          getEnrollments().catch(() => []),
          getClassMarks(classId).catch(() => []),
          getUsers().catch(() => [])
        ]);

        const safeClasses = Array.isArray(allClasses) ? allClasses : [];
        const safeEnrollments = Array.isArray(allEnrollments) ? allEnrollments : [];
        const safeMarks = Array.isArray(allMarks) ? allMarks : [];
        const safeUsers = Array.isArray(allUsers) ? allUsers : [];

        const currentClass = safeClasses.find(c => c.id.toString() === classId);
        if (currentClass) setClassName(currentClass.name);

        const enrollments = safeEnrollments.filter(e => e.class_id.toString() === classId);
        
        // Map student data with parent contact and deduplicate by username
        const studentMap = new Map();
        enrollments.forEach(e => {
          if (!studentMap.has(e.student_username)) {
            const user = safeUsers.find(u => u.username === e.student_username);
            studentMap.set(e.student_username, {
              username: e.student_username,
              parent_contact: user?.parent_contact || ""
            });
          }
        });
        setEnrolledStudents(Array.from(studentMap.values()));

        // Group marks by student
        const marksMap = {};
        safeMarks.forEach(m => {
          if (!marksMap[m.student_username]) marksMap[m.student_username] = [];
          marksMap[m.student_username].push(m);
        });
        setStudentMarks(marksMap);
      } catch (error) {
        console.error("Error loading class details:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [classId]);

  const calculateProgress = (username) => {
    const marks = studentMarks[username] || [];
    if (marks.length === 0) return 0;
    const totalObtained = marks.reduce((sum, m) => sum + m.score, 0);
    const totalPossible = marks.reduce((sum, m) => sum + m.total, 0);
    return Math.round((totalObtained / totalPossible) * 100);
  };

  const sendWhatsAppMessage = (student) => {
    const remarks = studentRemarks[student.username];
    if (!remarks) {
      alert("Please write remarks first.");
      return;
    }
    if (!student.parent_contact) {
      alert("Parent contact number not found for this student.");
      return;
    }

    const progress = calculateProgress(student.username);
    const teacherName = typeof window !== 'undefined' ? localStorage.getItem('username') : 'Teacher';
    const message = `Hello, this is a progress report of ${student.username}. 

Academic Progress: ${progress}%

Teacher's Remarks: ${remarks}

regards
${teacherName}
EduSync Management System`;
    
    // Format number (remove non-digits, ensure it's a valid international format if needed)
    const formattedNumber = student.parent_contact.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/${formattedNumber}?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar role="Teacher" />
      <div className="flex flex-1">
        <Sidebar role="Teacher" />
        <main className="flex-1 p-8 bg-gray-100">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link href="/teacher/classes" className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-50 transition-colors border border-gray-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
              </Link>
              <h2 className="text-3xl font-bold text-[#2d5a27]">{className} - Class Details</h2>
              <span className="bg-[#2d5a27]/10 text-[#2d5a27] px-3 py-1 rounded-full text-xs font-bold uppercase">
                ID: {classId}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
            <div className="p-6 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-gray-700 uppercase tracking-wider text-sm">Student Progress & Remarks</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-[10px] uppercase font-black tracking-widest border-b border-gray-100">
                    <th className="px-6 py-4">Student Name</th>
                    <th className="px-6 py-4">Current Progress</th>
                    <th className="px-6 py-4">Parent Contact</th>
                    <th className="px-6 py-4">Teacher Remarks</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {enrolledStudents.map((s) => {
                    const progress = calculateProgress(s.username);
                    return (
                      <tr key={s.username} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-100 text-[#2d5a27] rounded-full flex items-center justify-center font-bold text-xs">
                              {s.username[0].toUpperCase()}
                            </div>
                            <span className="font-semibold text-gray-700">{s.username}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden max-w-[120px]">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${
                                  progress >= 70 ? 'bg-green-500' : progress >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                            <span className="text-[10px] font-bold text-gray-400">
                              {progress}% Average Score
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                          {s.parent_contact || <span className="text-red-400 italic">Not Set</span>}
                        </td>
                        <td className="px-6 py-4">
                          <textarea
                            value={studentRemarks[s.username] || ""}
                            onChange={(e) => setStudentRemarks({...studentRemarks, [s.username]: e.target.value})}
                            placeholder="Write progress remarks..."
                            className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#2d5a27]/20 resize-none h-12"
                          />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => sendWhatsAppMessage(s)}
                            className="bg-[#25D366] text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 hover:bg-[#128C7E] transition-all ml-auto shadow-sm"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                            Send Remarks
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {enrolledStudents.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-gray-400 italic">
                        No students enrolled in this class.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
