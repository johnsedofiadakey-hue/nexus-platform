"use client";

import Link from "next/link";
import { Shield, Users } from "lucide-react";

// 🎨 Portal Selection Landing Page
export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Welcome to Nexus
          </h1>
          <p className="text-lg text-gray-600">
            Select your portal to continue
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Admin Portal */}
          <Link
            href="/auth/admin/signin"
            className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-blue-500 block"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Shield className="w-8 h-8 text-white" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Admin
              </h2>
              <p className="text-gray-600">
                Access the admin dashboard and management tools
              </p>
            </div>
          </Link>

          {/* Promoter Portal */}
          <Link
            href="/auth/promoter/signin"
            className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-green-500 block"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-blue-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Users className="w-8 h-8 text-white" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Promoter
              </h2>
              <p className="text-gray-600">
                Access the mobile POS and sales tools
              </p>
            </div>
          </Link>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          Secure access • Nexus Platform
        </div>
      </div>
    </div>
  );
}