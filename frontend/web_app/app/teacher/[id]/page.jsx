"use client";
import { use, useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import { getUsers, getClasses, getClassMarks, saveMark, getEnrollments, getNextItemNumber } from "../../../src/services/api";

export default function TeacherDashboard({ params }) {
  const unwrappedParams = use(params);
  const teacherId = unwrappedParams.id;
  const [students, setStudents] = useState([]);
  const [teacherClasses, setTeacherClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [classEnrollments, setClassEnrollments] = useState([]);
  const [marks, setMarks] = useState([]);
  const [studentRemarks, setStudentRemarks] = useState({});
  const [editingMark, setEditingMark] = useState(null);
  const [newMark, setNewMark] = useState({
    student_username: "",
    type: "Quiz",
    item_no: 1,
    score: 0,
    total: 10
  });

  // Helper to fetch next item number from API
  const fetchNextItemNo = async (classId, type) => {
    if (!classId) return;
    const nextNo = await getNextItemNumber(classId, type);
    setNewMark(prev => ({
      ...prev,
      item_no: nextNo
    }));
  };

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [userData, classData] = await Promise.all([getUsers(), getClasses()]);
        setStudents(userData.filter(u => u.category === "student") || []);
        
        // Filter classes for this teacher
        const myClasses = teacherId ? classData.filter(c => c.teacher_username?.toLowerCase() === teacherId.toLowerCase()) : [];
        setTeacherClasses(myClasses);
        if (myClasses.length > 0) {
          setSelectedClassId(String(myClasses[0].id)); // Store as string
        } else {
          setSelectedClassId(null);
        }
      } catch (error) {
        console.error("Error loading initial data:", error);
      }
    }
    loadInitialData();
  }, [teacherId]);

  useEffect(() => {
    if (selectedClassId) {
      loadClassData(selectedClassId);
    }
  }, [selectedClassId]);

  // Update item number when marks load, class changes, or type changes
  useEffect(() => {
    if (!editingMark && selectedClassId) {
      fetchNextItemNo(selectedClassId, newMark.type);
    }
  }, [selectedClassId, newMark.type, editingMark]);

  async function loadClassData(classId) {
    try {
      const [markData, enrollmentData] = await Promise.all([
        getClassMarks(classId),
        getEnrollments()
      ]);
      setMarks(markData || []);
      
      // Filter enrollments for this class
      const enrolled = enrollmentData.filter(e => e.class_id === parseInt(classId));
      setClassEnrollments(enrolled);
      
      // Update newMark.item_no immediately with fresh data from API
      if (!editingMark) {
        await fetchNextItemNo(classId, newMark.type);
      }
    } catch (error) {
      console.error("Error loading class data:", error);
    }
  }

  const handleSaveMark = async (e) => {
    e.preventDefault();
    try {
      // When creating a new mark, don't send item_no so backend calculates it
      const payload = {
        ...newMark,
        class_id: selectedClassId,
        score: parseInt(newMark.score),
        total: parseInt(newMark.total)
      };
      
      // If editing, keep item_no, otherwise omit it
      if (!editingMark) {
        delete payload.item_no;
      }

      await saveMark(payload);
      setEditingMark(null);
      // Reload marks first so next item calculation uses latest data
      const [markData, enrollmentData] = await Promise.all([
        getClassMarks(selectedClassId),
        getEnrollments()
      ]);
      setMarks(markData || []);
      const enrolled = enrollmentData.filter(e => e.class_id === parseInt(selectedClassId));
      setClassEnrollments(enrolled);
      // THEN reset form with next item number based on fresh data from API
      await fetchNextItemNo(selectedClassId, "Quiz");
      setNewMark({ student_username: "", type: "Quiz", item_no: 1, score: 0, total: 10 });
    } catch (error) {
      alert("Error saving marks");
    }
  };

  const startEdit = (mark) => {
    setEditingMark(mark.id);
    setNewMark({
      student_username: mark.student_username,
      type: mark.type,
      item_no: mark.item_no,
      score: mark.score,
      total: mark.total
    });
  };

  const calculateProgress = (username) => {
    const studentMarks = marks.filter(m => m.student_username === username);
    if (studentMarks.length === 0) return 0;
    const totalObtained = studentMarks.reduce((acc, m) => acc + m.score, 0);
    const totalPossible = studentMarks.reduce((acc, m) => acc + m.total, 0);
    return Math.round((totalObtained / totalPossible) * 100);
  };

  const sendWhatsAppMessage = (student) => {
    const studentUsername = student.student_username || student.username;
    const remarks = studentRemarks[studentUsername] || "Overall superb performance";
    const progress = calculateProgress(studentUsername);
    const message = `Hello, this is a progress report of ${studentUsername}. 

 Academic Progress: ${progress}% 

 Teacher's Remarks: ${remarks} 

 regards 
 ${teacherId} 
 EduSync Management System`;

    const userObj = students.find(u => u.username === studentUsername);
    if (!userObj || !userObj.parent_contact) {
      alert("Parent contact not found for this student.");
      return;
    }
    const formattedNumber = userObj.parent_contact.replace(/\D/g, '');
    window.open(`https://wa.me/${formattedNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar role="Teacher" />
      <div className="flex flex-1">
        <Sidebar role="Teacher" />
        <main className="flex-1 p-8 bg-gray-100">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-[#2d5a27]">Teacher Portal: {teacherId}</h2>
            
            <div className="flex items-center gap-4 bg-white p-2 rounded-lg shadow-sm border border-gray-200">
              <span className="text-sm font-bold text-gray-500 uppercase px-2">Select Class:</span>
              <select 
                value={selectedClassId || ""} 
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-md p-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-[#2d5a27]/20"
              >
                {teacherClasses.map(c => (
                  <option key={c.id} value={String(c.id)}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Marks Management Form */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                <h3 className="text-xl font-bold mb-6 text-[#2d5a27] flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                  {editingMark ? "Edit Marks" : "Upload Marks"}
                </h3>
                
                
                <form onSubmit={handleSaveMark} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Student</label>
                    <select
                      value={newMark.student_username}
                      onChange={(e) => setNewMark({...newMark, student_username: e.target.value})}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#2d5a27]/20"
                      required
                      disabled={!!editingMark}
                    >
                      <option value="">Select Student</option>
                      {classEnrollments.map(e => (
                        <option key={e.id} value={e.student_username}>{e.student_username}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Type</label>
                      <select
                        value={newMark.type}
                        onChange={async (e) => {
                          const newType = e.target.value;
                          if (!editingMark && selectedClassId) {
                            const nextItemNo = await getNextItemNumber(selectedClassId, newType);
                            setNewMark({
                              ...newMark,
                              type: newType,
                              item_no: nextItemNo
                            });
                          } else {
                            setNewMark({
                              ...newMark,
                              type: newType
                            });
                          }
                        }}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#2d5a27]/20"
                      >
                        <option value="Quiz">Quiz</option>
                        <option value="Assignment">Assignment</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Number</label>
                      <input
                        type="number"
                        min="1"
                        value={newMark.item_no}
                        disabled={!editingMark}
                        onChange={(e) => setNewMark({...newMark, item_no: Number(e.target.value)})}
                        className={`w-full p-3 border border-gray-200 rounded-lg outline-none ${!editingMark ? 'bg-gray-200 cursor-not-allowed text-gray-600' : 'bg-gray-50 focus:ring-2 focus:ring-[#2d5a27]/20'}`}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Obtained</label>
                      <input
                        type="number"
                        min="0"
                        value={newMark.score}
                        onChange={(e) => setNewMark({...newMark, score: e.target.value})}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#2d5a27]/20"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Total</label>
                      <input
                        type="number"
                        min="1"
                        value={newMark.total}
                        onChange={(e) => setNewMark({...newMark, total: e.target.value})}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#2d5a27]/20"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      className="flex-1 bg-[#2d5a27] text-white py-3 rounded-lg font-bold hover:bg-[#1e3d1a] transition-all shadow-md"
                    >
                      {editingMark ? "Update Marks" : "Save Marks"}
                    </button>
                    {editingMark && (
                      <button
                        type="button"
                        onClick={async () => {
                          setEditingMark(null);
                          if (selectedClassId) {
                            await fetchNextItemNo(selectedClassId, "Quiz");
                          }
                          setNewMark({ student_username: "", type: "Quiz", item_no: 1, score: 0, total: 10 });
                        }}
                        className="px-4 bg-gray-200 text-gray-600 rounded-lg font-bold hover:bg-gray-300 transition-all"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>

            {/* Marks Record Table */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                  <h3 className="font-bold text-gray-700 uppercase tracking-wider text-sm">Marks Record</h3>
                  <span className="bg-[#2d5a27]/10 text-[#2d5a27] px-3 py-1 rounded-full text-xs font-bold">
                    {marks.length} Records
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500 text-[10px] uppercase font-black tracking-widest border-b border-gray-100">
                        <th className="px-6 py-4">Student</th>
                        <th className="px-6 py-4">Assessment</th>
                        <th className="px-6 py-4">Marks</th>
                        <th className="px-6 py-4">Percentage</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {marks.map((m) => (
                        <tr key={m.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-7 h-7 bg-gray-100 text-gray-500 rounded-full flex items-center justify-center font-bold text-[10px]">
                                {m.student_username[0].toUpperCase()}
                              </div>
                              <span className="font-semibold text-gray-700">{m.student_username}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                              m.type === 'Quiz' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                            }`}>
                              {m.type} #{m.item_no}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-bold text-gray-700">
                            {m.score} <span className="text-gray-400 font-normal">/ {m.total}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden max-w-[100px]">
                              <div 
                                className={`h-full rounded-full ${
                                  (m.score/m.total) >= 0.5 ? 'bg-green-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${Math.min(100, (m.score/m.total)*100)}%` }}
                              ></div>
                            </div>
                            <span className="text-[10px] font-bold text-gray-400 mt-1 block">
                              {Math.round((m.score/m.total)*100)}%
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => startEdit(m)}
                              className="text-[#2d5a27] hover:text-[#1e3d1a] font-bold text-xs flex items-center gap-1 ml-auto"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                              </svg>
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                      {marks.length === 0 && (
                        <tr>
                          <td colSpan="5" className="px-6 py-12 text-center text-gray-400 italic">
                            No marks recorded for this class yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Student Details & Progress Section */}
          <div className="mt-8 bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
            <div className="p-6 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-gray-700 uppercase tracking-wider text-sm">Class Students & Progress</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-[10px] uppercase font-black tracking-widest border-b border-gray-100">
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4">Academic Progress</th>
                    <th className="px-6 py-4">Teacher's Remarks</th>
                    <th className="px-6 py-4 text-right">Communication</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {classEnrollments.map((e) => {
                    const progress = calculateProgress(e.student_username);
                    return (
                      <tr key={e.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-[#2d5a27]/10 text-[#2d5a27] rounded-full flex items-center justify-center font-bold text-xs">
                              {e.student_username[0].toUpperCase()}
                            </div>
                            <span className="font-semibold text-gray-700">{e.student_username}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="flex-1 bg-gray-100 h-2 rounded-full overflow-hidden max-w-[150px]">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${
                                  progress >= 70 ? 'bg-green-500' : progress >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-bold text-gray-600">{progress}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            placeholder="Write remarks..."
                            value={studentRemarks[e.student_username] || ""}
                            onChange={(ev) => setStudentRemarks({
                              ...studentRemarks,
                              [e.student_username]: ev.target.value
                            })}
                            className="w-full p-2 text-sm bg-gray-50 border border-gray-200 rounded-md outline-none focus:ring-2 focus:ring-[#2d5a27]/20"
                          />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => sendWhatsAppMessage(e)}
                            className="bg-[#2d5a27] text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-[#1e3d1a] transition-all flex items-center gap-2 ml-auto shadow-sm active:scale-95"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                            Send Report
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
