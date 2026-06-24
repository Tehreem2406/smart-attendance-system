"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

const data = [
  { day: "Mon", attendance: 80 },
  { day: "Tue", attendance: 95 },
  { day: "Wed", attendance: 90 },
  { day: "Thu", attendance: 85 },
  { day: "Fri", attendance: 88 },
];

export default function AttendanceChart() {
  return (
    <div className="p-6 bg-white rounded-2xl shadow h-80">
      <h3 className="text-xl font-semibold mb-4">Weekly Attendance</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" padding={{ left: 10, right: 10 }} />
          <YAxis />
          <Tooltip />
          <Bar dataKey="attendance" fill="#3b82f6" radius={8} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
