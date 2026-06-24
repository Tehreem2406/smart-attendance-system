export default function DashboardCard({ title, count, className }) {
  return (
    <div className="p-6 bg-white rounded-2xl shadow hover:shadow-lg transition">
      <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
      <p className={`text-3xl font-bold mt-3 ${className || "text-[#2d5a27]"}`}>{count}</p>
    </div>
  );
}
