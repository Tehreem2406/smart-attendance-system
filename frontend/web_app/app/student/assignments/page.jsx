"use client";

import { useState, useEffect } from "react";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import { studentClasses, getAssignments, submitAssignment, getSubmissions } from "../../../src/services/api";

export default function StudentAssignments() {
  const [classes, setClasses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [selectedFile, setSelectedClassFile] = useState({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");

  useEffect(() => {
    const loadData = async () => {
      const currentUsername = typeof window !== "undefined" ? localStorage.getItem("username") : null;
      if (currentUsername) {
        setUsername(currentUsername);
        const classesData = await studentClasses(currentUsername);
        setClasses(classesData || []);
        
        // Load all assignments for all student's classes
        let allAssignments = [];
        let allSubmissions = [];
        for (const cls of classesData) {
          const classAssignments = await getAssignments(cls.id);
          allAssignments = [...allAssignments, ...classAssignments.map(a => ({...a, className: cls.name}))];
          
          for (const assign of classAssignments) {
            const subs = await getSubmissions(assign.id);
            const mySub = subs.find(s => s.student_username === currentUsername);
            if (mySub) {
              allSubmissions.push(assign.id);
            }
          }
        }
        setAssignments(allAssignments);
        setSubmissions(allSubmissions);
      }
    };
    loadData();
  }, []);

  const handleFileChange = (assignmentId, file) => {
    setSelectedClassFile(prev => ({
      ...prev,
      [assignmentId]: file
    }));
  };

  const handleSubmit = async (assignmentId) => {
    const file = selectedFile[assignmentId];
    if (!file) {
      alert("Please select a file first.");
      return;
    }
    if (file.type !== "application/pdf") {
      alert("Only PDF files are allowed.");
      return;
    }

    setLoading(true);
    try {
      const res = await submitAssignment(assignmentId, username, file);
      if (res.id) {
        setMessage("Assignment submitted successfully!");
        setSubmissions(prev => [...prev, assignmentId]);
      } else {
        setMessage(`Error: ${res.detail || "Submission failed"}`);
      }
    } catch (error) {
      setMessage("Error submitting assignment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Navbar role="Student" />
      <div className="flex flex-1">
        <Sidebar role="Student" />
        <main className="flex-1 p-8">
          <h2 className="text-3xl font-bold mb-8 text-[#2d5a27]">My Assignments</h2>

          {message && (
            <div className={`p-4 mb-6 rounded-lg ${message.includes("Error") ? "bg-red-100 text-red-700" : "bg-[#2d5a27]/10 text-[#2d5a27]"}`}>
              {message}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assignments.map((assign) => {
              const isSubmitted = submissions.includes(assign.id);
              const isPastDue = new Date(assign.due_date) < new Date();

              return (
                <div key={assign.id} className="bg-white p-6 rounded-xl shadow-md border-t-4 border-[#2d5a27]">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase bg-gray-100 px-2 py-1 rounded text-gray-600 mb-2 inline-block">
                        {assign.className}
                      </span>
                      <h3 className="text-xl font-bold text-gray-800">
                        Assignment {assign.item_no || assignments.indexOf(assign) + 1}: {assign.topic}
                      </h3>
                    </div>
                    {isSubmitted && (
                      <span className="bg-[#2d5a27]/10 text-[#2d5a27] text-[10px] font-black px-2 py-1 rounded uppercase">
                        Submitted
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Total Marks:</span>
                      <span className="font-bold text-gray-800">{assign.total_marks}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Due Date:</span>
                      <span className={`font-bold ${isPastDue && !isSubmitted ? "text-red-600" : "text-gray-800"}`}>
                        {new Date(assign.due_date).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {!isSubmitted ? (
                    <div className="space-y-4">
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => handleFileChange(assign.id, e.target.files[0])}
                        className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#2d5a27]/5 file:text-[#2d5a27] hover:file:bg-[#2d5a27]/10"
                      />
                      <button
                        onClick={() => handleSubmit(assign.id)}
                        disabled={loading || isPastDue}
                        className="w-full py-2 bg-[#2d5a27] text-white rounded-lg font-bold text-sm hover:bg-[#244b1f] transition-colors disabled:opacity-50"
                      >
                        {loading ? "Submitting..." : isPastDue ? "Past Due" : "Submit PDF"}
                      </button>
                    </div>
                  ) : (
                    <div className="bg-[#2d5a27]/5 p-3 rounded-lg text-center text-[#2d5a27] text-sm font-medium">
                      Assignment successfully submitted!
                    </div>
                  )}
                </div>
              );
            })}
            {assignments.length === 0 && (
              <div className="col-span-full py-12 text-center text-gray-500 italic bg-white rounded-xl shadow-sm">
                No assignments found for your classes.
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
