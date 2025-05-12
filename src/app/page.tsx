import AuthNav from "@/components/auth/AuthNav";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col font-[family-name:var(--font-geist-sans)]">
      <AuthNav />
      
      <div className="flex-1 flex flex-col items-center justify-center p-8 pb-20 gap-8 sm:p-20">
        <main className="max-w-4xl w-full">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Welcome to Project Aqua</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              A secure and modern web application with authentication built-in
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="bg-blue-50 rounded-lg border border-blue-100 p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-3">Authentication Ready</h2>
              <p className="text-gray-700 mb-4">This project has been set up with Supabase authentication. You can:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
                <li>Create an account</li>
                <li>Sign in to your account</li>
                <li>Reset your password</li>
                <li>Access protected routes</li>
              </ul>
              <div className="flex gap-3">
                <Link 
                  href="/signup" 
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                >
                  Get Started
                </Link>
                <Link 
                  href="/signin" 
                  className="px-4 py-2 border border-blue-600 text-blue-600 text-sm rounded hover:bg-blue-50 transition-colors"
                >
                  Sign In
                </Link>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg border border-gray-100 p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-3">Features</h2>
              <p className="text-gray-700 mb-4">Project Aqua provides a solid foundation for your application:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
                <li>Next.js 14 with App Router</li>
                <li>Supabase Authentication</li>
                <li>Responsive UI with Tailwind CSS</li>
                <li>TypeScript for type safety</li>
                <li>Protected routes with middleware</li>
              </ul>
              <Link 
                href="/dashboard" 
                className="px-4 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700 transition-colors inline-block"
              >
                View Dashboard
              </Link>
            </div>
          </div>
        </main>
        
        <footer className="text-center text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} Project Aqua. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
