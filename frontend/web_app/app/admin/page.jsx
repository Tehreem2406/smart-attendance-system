"use client";

import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

import DashboardCard from "../components/Dashboardcard";
import ActionBox from "../components/ActionBox";
import AttendanceChart from "../components/AttendanceChart";
import MonthlyTrendChart from "../components/MonthlyTrendChart";
import { getDashboardStats } from "../../src/services/api";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    total_users: 0,
    teachers: 0,
    students: 0,
    attendance_today: 0,
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await getDashboardStats();
        if (data && !data.error) {
          setStats(data);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Navbar role="Admin" />

      <div className="flex flex-1">
        <Sidebar role="Admin" />

        <main className="flex-1 p-8">
          <h2 className="text-3xl font-bold mb-8 text-[#2d5a27]">Admin Overview</h2>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <DashboardCard title="Total Users" count={stats.total_users} className="text-gray-800 border-l-4 border-[#2d5a27] pl-4 ml-2" />
            <DashboardCard title="Teachers" count={stats.teachers} className="text-gray-800 border-l-4 border-[#2d5a27] pl-4 ml-2" />
            <DashboardCard title="Students" count={stats.students} className="text-gray-800 border-l-4 border-[#2d5a27] pl-4 ml-2" />
            <DashboardCard title="Attendance Today" count={stats.attendance_today} className="text-gray-800 border-l-4 border-[#2d5a27] pl-4 ml-2" />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
              <h3 className="text-lg font-bold text-[#2d5a27] mb-6 uppercase tracking-wider text-sm">Attendance Distribution</h3>
              <AttendanceChart />
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
              <h3 className="text-lg font-bold text-[#2d5a27] mb-6 uppercase tracking-wider text-sm">Monthly Enrollment Trend</h3>
              <MonthlyTrendChart />
            </div>
          </div>

          {/* Quick Actions */}
          <h3 className="text-2xl font-bold mb-6 text-[#2d5a27]">System Management</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <ActionBox title="Manage Users" link="/admin/users" className="hover:border-[#2d5a27]" />
            <ActionBox title="Manage Classes" link="/admin/classes" className="hover:border-[#2d5a27]" />
            <ActionBox title="Attendance Reports" link="/admin/reports" className="hover:border-[#2d5a27]" />
          </div>
        </main>
      </div>
    </div>
  );
}
