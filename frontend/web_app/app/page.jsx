'use client';

import { useState } from 'react';

export default function Home() {
  const [category, setCategory] = useState('');

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      {!category ? (
        <div className="space-y-6 text-center">
          <h1 className="text-3xl font-bold">Smart Attendance System</h1>
          <p className="text-lg">Select your category to login:</p>

          <div className="flex gap-6 justify-center">
            <button
              onClick={() => setCategory('admin')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              Admin
            </button>

            <button
              onClick={() => setCategory('teacher')}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition"
            >
              Teacher
            </button>

            <button
              onClick={() => setCategory('student')}
              className="bg-yellow-500 text-white px-6 py-3 rounded-lg hover:bg-yellow-600 transition"
            >
              Student
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
          <h2 className="text-2xl font-bold mb-6 text-center capitalize">{category} Login</h2>

          <form className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1">Username</label>
              <input
                type="text"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-300"
                placeholder="Enter your username"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-300"
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Login
            </button>
          </form>

          <button
            onClick={() => setCategory('')}
            className="mt-4 text-blue-600 underline"
          >
            Back
          </button>
        </div>
      )}
    </div>
  );
}
