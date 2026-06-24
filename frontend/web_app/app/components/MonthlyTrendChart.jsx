"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { month: "Jan", value: 75 },
  { month: "Feb", value: 85 },
  { month: "Mar", value: 78 },
  { month: "Apr", value: 90 },
  { month: "May", value: 88 },
];

export default function MonthlyTrendChart() {
  return (
    <div className="p-6 bg-white rounded-2xl shadow h-80">
      <h3 className="text-xl font-semibold mb-4">Monthly Attendance Trend</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ bottom: 20 }}>
          <XAxis dataKey="month" padding={{ left: 10, right: 10 }} />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
