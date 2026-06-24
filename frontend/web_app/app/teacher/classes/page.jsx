"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import { getClasses, getEnrollments } from "../../../src/services/api";

export default function TeacherClasses() {
  const [classes, setClasses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [username, setUsername] = useState("");

  useEffect(() => {
    async function loadData() {
      let currentUsername = "";
      if (typeof window !== "undefined") {
        currentUsername = localStorage.getItem("username") || "";
        setUsername(currentUsername);
      }

      if (currentUsername) {
        try {
          const [allClasses, allEnrollments] = await Promise.all([
            getClasses(),
            getEnrollments()
          ]);
          const safeClasses = Array.isArray(allClasses) ? allClasses : [];
          setClasses(safeClasses.filter((c) => c.teacher_username?.toLowerCase() === currentUsername.toLowerCase()));
          setEnrollments(Array.isArray(allEnrollments) ? allEnrollments : []);
        } catch (error) {
          console.error("Error loading data:", error);
        }
      } else {
        setClasses([]);
      }
    }
    loadData();
  }, []);

  const getStudentCount = (classId) => {
    const classEnrollments = enrollments.filter(e => String(e.class_id) === String(classId));
    const uniqueStudentUsernames = new Set(classEnrollments.map(e => e.student_username));
    return uniqueStudentUsernames.size;
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar role="Teacher" />
      <div className="flex flex-1">
        <Sidebar role="Teacher" />
        <main className="flex-1 p-8 bg-gray-100">
          <h2 className="text-3xl font-bold mb-8 text-[#2d5a27]">My Classes {username && <span className="text-gray-500 text-lg font-medium ml-2">({username})</span>}</h2>
          
          {classes.length === 0 ? (
            <div className="bg-white p-12 rounded-xl shadow-md text-center">
              <p className="text-gray-400 italic text-lg">No classes assigned to you yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {classes.map((cls) => (
                <Link 
                  href={`/teacher/classes/${cls.id}`} 
                  key={`${cls.id}-${cls.name}`}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all border border-gray-100 group"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-[#2d5a27]/10 rounded-lg text-[#2d5a27] group-hover:bg-[#2d5a27] group-hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.168.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.168.477-4.5 1.253" />
                        </svg>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 bg-gray-50 px-2 py-1 rounded">
                        ID: {cls.id}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{cls.name}</h3>
                    <div className="flex items-center text-sm text-gray-500 mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      {getStudentCount(cls.id)} Students Enrolled
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                      <span className="text-xs font-bold text-[#2d5a27] uppercase tracking-wider">View Details</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#2d5a27] transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
