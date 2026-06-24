"use client";

import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import { getUsers, createUser, deleteUser, setUserEmail, setUserContact } from "../../../src/services/api";
import { Trash2, FileDown, Edit2, Check, X } from "lucide-react";
import * as XLSX from "xlsx";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ username: "", password: "", category: "teacher", email: "", parent_contact: "" });
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    async function load() {
      const data = await getUsers();
      setUsers(data);
    }
    load();
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    const created = await createUser(form);
    let updated = created;
    if (form.category !== "student" && form.email) {
      const res = await setUserEmail(form.username, form.email);
      if (res && res.email) {
        updated = { ...created, email: res.email };
      }
    } else if (form.category === "student" && form.parent_contact) {
      const res = await setUserContact(form.username, form.parent_contact);
      if (res && res.parent_contact) {
        updated = { ...created, parent_contact: res.parent_contact };
      }
    }
    setUsers((prev) => [...prev, updated]);
    setForm({ username: "", password: "", category: "teacher", email: "", parent_contact: "" });
  }

  async function handleDelete(id) {
    await deleteUser(id);
    setUsers((prev) => prev.filter((u) => u.id !== id));
  }

  async function handleSaveEdit(user) {
    if (user.category === 'student') {
      await setUserContact(user.username, editValue);
      setUsers(users.map(u => u.id === user.id ? { ...u, parent_contact: editValue } : u));
    } else {
      await setUserEmail(user.username, editValue);
      setUsers(users.map(u => u.id === user.id ? { ...u, email: editValue } : u));
    }
    setEditingId(null);
  }

  function exportUsersExcel() {
    const rows = users.map((u) => ({ 
      Username: u.username, 
      Email: u.email || "", 
      "Parent Contact": u.parent_contact || "",
      Password: u.password, 
      Role: u.category 
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Users");
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "users.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Navbar role="Admin" />
      <div className="flex flex-1">
        <Sidebar role="Admin" />
        <main className="flex-1 p-8">
          <h1 className="text-3xl font-bold mb-8 text-[#2d5a27]">Manage Users</h1>

          <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-gray-100">
            <h2 className="text-xl font-bold mb-6 text-gray-800">Add New User</h2>
            <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <input
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2d5a27]/20 focus:border-[#2d5a27] transition-all"
                placeholder="Username"
                required
              />
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2d5a27]/20 focus:border-[#2d5a27] transition-all"
                placeholder="Password"
                required
              />
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2d5a27]/20 focus:border-[#2d5a27] transition-all bg-white"
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
                <option value="finance">Finance</option>
              </select>
              {form.category === "student" ? (
                <input
                  value={form.parent_contact}
                  onChange={(e) => setForm({ ...form, parent_contact: e.target.value })}
                  className="p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2d5a27]/20 focus:border-[#2d5a27] transition-all"
                  placeholder="Parent Contact"
                  required
                />
              ) : (
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2d5a27]/20 focus:border-[#2d5a27] transition-all"
                  placeholder="Email (Optional)"
                />
              )}
              <div className="hidden lg:block"></div> {/* Spacer for alignment */}
              <button
                type="submit"
                className="bg-[#2d5a27] text-white py-3 px-6 rounded-lg font-bold hover:bg-[#1e3d1a] transition-all shadow-md hover:shadow-lg"
              >
                Add User
              </button>
            </form>
          </div>

          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="p-4 font-bold text-[#2d5a27] uppercase text-xs tracking-wider">Username</th>
                  <th className="p-4 font-bold text-[#2d5a27] uppercase text-xs tracking-wider">Category</th>
                  <th className="p-4 font-bold text-[#2d5a27] uppercase text-xs tracking-wider">Email / Contact</th>
                  <th className="p-4 font-bold text-[#2d5a27] uppercase text-xs tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 font-medium text-gray-800">{u.username}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        u.category === 'admin' ? 'bg-purple-100 text-purple-700' :
                        u.category === 'teacher' ? 'bg-blue-100 text-blue-700' :
                        u.category === 'finance' ? 'bg-orange-100 text-orange-700' :
                        'bg-[#2d5a27]/10 text-[#2d5a27]'
                      }`}>
                        {u.category}
                      </span>
                    </td>
                    <td className="p-4 text-gray-500 text-sm">
                      {editingId === u.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="p-1 border border-[#2d5a27] rounded focus:outline-none w-full max-w-[200px]"
                            autoFocus
                          />
                          <button onClick={() => handleSaveEdit(u)} className="text-green-600 hover:text-green-800">
                            <Check size={16} />
                          </button>
                          <button onClick={() => setEditingId(null)} className="text-red-500 hover:text-red-700">
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between group">
                          <span>{u.category === 'student' ? (u.parent_contact || '-') : (u.email || '-')}</span>
                          <button 
                            onClick={() => {
                              setEditingId(u.id);
                              setEditValue(u.category === 'student' ? (u.parent_contact || '') : (u.email || ''));
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 text-gray-400 hover:text-[#2d5a27]"
                          >
                            <Edit2 size={14} />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {u.category !== 'admin' && (
                        <button
                          onClick={() => handleDelete(u.id)}
                          className="text-red-500 hover:text-red-700 font-bold text-sm transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}
