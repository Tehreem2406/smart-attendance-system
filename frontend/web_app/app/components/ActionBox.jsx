"use client";

import Link from "next/link";

export default function ActionBox({ title, link }) {
  return (
    <Link
      href={link}
      className="p-6 bg-white rounded-2xl shadow border hover:bg-[#2d5a27]/5 transition block"
    >
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="text-sm text-gray-500 mt-2">Click to manage</p>
    </Link>
  );
}
