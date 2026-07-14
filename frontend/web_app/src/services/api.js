const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

export const loginUser = async (username, password, role) => {
  try {
    const response = await fetch(`${BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, category: (role || "").toLowerCase() }),
    });
    const data = await response.json();
    return data;
  } catch (_error) {
    return { error: "Network error" };
  }
};

export const getUsers = async () => {
  const res = await fetch(`${BASE_URL}/users`);
  return res.json();
};

export const createUser = async (user) => {
  const res = await fetch(`${BASE_URL}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user),
  });
  return res.json();
};

export const deleteUser = async (id) => {
  const res = await fetch(`${BASE_URL}/users/${id}`, {
    method: "DELETE",
  });
  return res.json();
};

export const getClasses = async () => {
  const res = await fetch(`${BASE_URL}/classes`);
  return res.json();
};

export const createClass = async (cls) => {
  const res = await fetch(`${BASE_URL}/classes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cls),
  });
  return res.json();
};

export const enrollStudent = async (enroll) => {
  const res = await fetch(`${BASE_URL}/enrollments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(enroll),
  });
  return res.json();
};

export const classStudents = async (classId) => {
  const res = await fetch(`${BASE_URL}/classes/${classId}/students`);
  return res.json();
};

export const createSession = async (classId, meetingUrl) => {
  const res = await fetch(`${BASE_URL}/sessions/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ class_id: classId, meeting_url: meetingUrl }),
  });
  return res.json();
};

export const getActiveSession = async (classId) => {
  const res = await fetch(`${BASE_URL}/sessions/active/${classId}`);
  return res.json();
};

export const joinSession = async (code, studentUsername, latitude = null, longitude = null) => {
  const res = await fetch(`${BASE_URL}/sessions/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, student_username: studentUsername, latitude, longitude }),
  });
  return res.json();
};

export const endSession = async (classId) => {
  const res = await fetch(`${BASE_URL}/sessions/end`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ class_id: classId }),
  });
  return res.json();
};

export const sessionAttendance = async (sessionId) => {
  const res = await fetch(`${BASE_URL}/sessions/${sessionId}/attendance`);
  return res.json();
};

export const addMark = async (mark) => {
  const res = await fetch(`${BASE_URL}/marks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(mark),
  });
  return res.json();
};

export const listMarks = async (studentUsername) => {
  const res = await fetch(`${BASE_URL}/marks/${studentUsername}`);
  return res.json();
};

export const deleteClassMarks = async (classId) => {
  const res = await fetch(`${BASE_URL}/classes/${classId}/marks`, {
    method: "DELETE",
  });
  return res.json();
};

export const listAttendance = async (studentUsername) => {
  const res = await fetch(`${BASE_URL}/attendance/${studentUsername}`);
  return res.json();
};

export const studentClasses = async (username) => {
  const res = await fetch(`${BASE_URL}/student/${username}/classes`);
  return res.json();
};

export const studentActiveSession = async (username) => {
  const res = await fetch(`${BASE_URL}/student/${username}/active-session`);
  return res.json();
};

export const setUserEmail = async (username, email) => {
  const res = await fetch(`${BASE_URL}/users/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email }),
  });
  return res.json();
};

export const setUserContact = async (username, parent_contact) => {
  const res = await fetch(`${BASE_URL}/users/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, parent_contact }),
  });
  return res.json();
};

export const requestPasswordReset = async (username, role, email) => {
  const res = await fetch(`${BASE_URL}/password/reset-request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, category: (role || "").toLowerCase(), email }),
  });
  return res.json();
};

export const confirmPasswordReset = async (username, role, code, newPassword) => {
  const res = await fetch(`${BASE_URL}/password/reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, category: (role || "").toLowerCase(), code, new_password: newPassword }),
  });
  return res.json();
};
 
export const verifyResetCode = async (username, role, code) => {
  const res = await fetch(`${BASE_URL}/password/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, category: (role || "").toLowerCase(), code }),
  });
  return res.json();
};

export const getClassAttendance = async (classId) => {
  const res = await fetch(`${BASE_URL}/classes/${classId}/attendance_records`);
  return res.json();
};

export const getDashboardStats = async () => {
  const res = await fetch(`${BASE_URL}/dashboard/stats`);
  return res.json();
};

export const getFinanceStats = async () => {
  const res = await fetch(`${BASE_URL}/finance/dashboard/stats`);
  return res.json();
};

export const getClassMarks = async (classId) => {
  const res = await fetch(`${BASE_URL}/classes/${classId}/marks`);
  return res.json();
};

export const saveMark = async (payload) => {
  const res = await fetch(`${BASE_URL}/marks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
};

export const deleteMark = async (markId) => {
  const res = await fetch(`${BASE_URL}/marks/${markId}`, {
    method: "DELETE",
  });
  return res.json();
};

export const getAttendanceReport = async (classId, month) => {
  let url = `${BASE_URL}/reports/attendance?`;
  if (classId) url += `class_id=${classId}&`;
  if (month) url += `month=${month}`;
  const res = await fetch(url);
  return res.json();
};

export const exportAttendanceReport = async (classId, month) => {
  let url = `${BASE_URL}/reports/attendance/export?`;
  if (classId) url += `class_id=${classId}&`;
  if (month) url += `month=${month}`;
  const res = await fetch(url);
  const blob = await res.blob();
  const link = document.createElement("a");
  link.href = window.URL.createObjectURL(blob);
  link.download = "attendance_report.csv";
  link.click();
};

export const createFeeStructure = async (feeStructure) => {
  const res = await fetch(`${BASE_URL}/fee_structures`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(feeStructure),
  });
  return res.json();
};

export const getFeeStructures = async () => {
  const res = await fetch(`${BASE_URL}/fee_structures`);
  if (!res.ok) return [];
  return res.json();
};

export const createSalary = async (salary) => {
  const res = await fetch(`${BASE_URL}/salaries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(salary),
  });
  return res.json();
};

export const getSalaries = async () => {
  const res = await fetch(`${BASE_URL}/salaries`);
  return res.json();
};

export const getVouchers = async (studentUsername, classId) => {
  let url = `${BASE_URL}/vouchers?`;
  if (studentUsername) url += `student_username=${studentUsername}&`;
  if (classId) url += `class_id=${classId}`;
  const res = await fetch(url);
  return res.json();
};

export const updateVoucherStatus = async (voucherId, status) => {
  const res = await fetch(`${BASE_URL}/vouchers/${voucherId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  return res.json();
};

export const updateSalaryStatus = async (salaryId, status) => {
  const res = await fetch(`${BASE_URL}/salaries/${salaryId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  return res.json();
};

export const createAssignment = async (assignment) => {
  const res = await fetch(`${BASE_URL}/assignments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(assignment),
  });
  return res.json();
};

export const getAssignments = async (classId) => {
  const res = await fetch(`${BASE_URL}/classes/${classId}/assignments`);
  return res.json();
};

export const submitAssignment = async (assignmentId, studentUsername, file) => {
  const formData = new FormData();
  formData.append("file", file);
  
  const res = await fetch(`${BASE_URL}/assignments/${assignmentId}/submit?student_username=${studentUsername}`, {
    method: "POST",
    body: formData,
  });
  return res.json();
};

export const getSubmissions = async (assignmentId) => {
  const res = await fetch(`${BASE_URL}/assignments/${assignmentId}/submissions`);
  return res.json();
};

export const getClassSubmissions = async (classId) => {
  const res = await fetch(`${BASE_URL}/classes/${classId}/submissions`);
  return res.json();
};

export const getEnrollments = async () => {
  const res = await fetch(`${BASE_URL}/enrollments`);
  return res.json();
};

export const checkAssignment = async (submissionId) => {
  const res = await fetch(`${BASE_URL}/submissions/${submissionId}/check`, {
    method: "POST"
  });
  return res.json();
};

export const downloadSubmission = async (submissionId) => {
  const res = await fetch(`${BASE_URL}/submissions/${submissionId}/download`);
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `submission_${submissionId}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
};

export const getNextItemNumber = async (classId, type) => {
  const res = await fetch(`${BASE_URL}/classes/${classId}/marks/next-item-no?type=${encodeURIComponent(type)}`);
  const data = await res.json();
  return data.next_item_no;
};

// Ledger Functions
export const getLedger = async (relatedUser = null, type = null) => {
  const params = new URLSearchParams();
  if (relatedUser) params.append("related_user", relatedUser);
  if (type) params.append("type", type);
  
  let url = `${BASE_URL}/ledger`;
  const paramString = params.toString();
  if (paramString) url += `?${paramString}`;
  
  const res = await fetch(url);
  return res.json();
};

export const getLedgerStats = async () => {
  const res = await fetch(`${BASE_URL}/ledger/stats`);
  return res.json();
};

export const createLedgerEntry = async (entry) => {
  const res = await fetch(`${BASE_URL}/ledger`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  });
  return res.json();
};

export const updateLedgerEntry = async (entryId, entry) => {
  const res = await fetch(`${BASE_URL}/ledger/${entryId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  });
  return res.json();
};

export const deleteLedgerEntry = async (entryId) => {
  const res = await fetch(`${BASE_URL}/ledger/${entryId}`, {
    method: "DELETE",
  });
  return res.json();
};

// Budget Functions
export const createBudget = async (budget) => {
  const res = await fetch(`${BASE_URL}/budgets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(budget),
  });
  return res.json();
};

export const getBudgets = async (month, year) => {
  let url = `${BASE_URL}/budgets`;
  const params = new URLSearchParams();
  if (month) params.append("month", month);
  if (year) params.append("year", year);
  if (params.toString()) url += `?${params.toString()}`;
  
  const res = await fetch(url);
  return res.json();
};

export const updateBudget = async (budgetId, budget) => {
  const res = await fetch(`${BASE_URL}/budgets/${budgetId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(budget),
  });
  return res.json();
};

export const deleteBudget = async (budgetId) => {
  const res = await fetch(`${BASE_URL}/budgets/${budgetId}`, {
    method: "DELETE",
  });
  return res.json();
};
