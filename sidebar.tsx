import { Link } from "wouter";
import { Home, BookOpen, Calendar, FolderOpen, BarChart2, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export function Sidebar() {
  const { user, logoutMutation } = useAuth();
  const isActiveRoute = (path: string) => window.location.pathname === path;

  return (
    <aside className="hidden md:flex md:flex-col w-64 bg-white border-r border-gray-200 min-h-screen">
      <div className="flex items-center h-16 px-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-primary">Student Workflow</h1>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        <Link href="/">
          <a className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            isActiveRoute("/") ? "bg-blue-100 text-blue-600" : "text-gray-600 hover:bg-gray-100"
          }`}>
            <Home className="w-5 h-5 mr-3" />
            Dashboard
          </a>
        </Link>

        <Link href="/tasks">
          <a className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            isActiveRoute("/tasks") ? "bg-blue-100 text-blue-600" : "text-gray-600 hover:bg-gray-100"
          }`}>
            <BookOpen className="w-5 h-5 mr-3" />
            Tasks
          </a>
        </Link>

        <Link href="/calendar">
          <a className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            isActiveRoute("/calendar") ? "bg-blue-100 text-blue-600" : "text-gray-600 hover:bg-gray-100"
          }`}>
            <Calendar className="w-5 h-5 mr-3" />
            Calendar
          </a>
        </Link>

        <Link href="/resources">
          <a className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            isActiveRoute("/resources") ? "bg-blue-100 text-blue-600" : "text-gray-600 hover:bg-gray-100"
          }`}>
            <FolderOpen className="w-5 h-5 mr-3" />
            Resources
          </a>
        </Link>

        <Link href="/analytics">
          <a className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            isActiveRoute("/analytics") ? "bg-blue-100 text-blue-600" : "text-gray-600 hover:bg-gray-100"
          }`}>
            <BarChart2 className="w-5 h-5 mr-3" />
            Analytics
          </a>
        </Link>
      </nav>

      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
            {user?.displayName?.charAt(0).toUpperCase() || user?.username?.charAt(0).toUpperCase()}
          </div>
          <span className="font-medium">{user?.displayName || user?.username}</span>
        </div>
        <button
          onClick={() => logoutMutation.mutate()}
          className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100 w-full"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Logout
        </button>
      </div>
    </aside>
  );
}