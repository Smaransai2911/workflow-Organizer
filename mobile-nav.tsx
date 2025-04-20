import { Link } from "wouter";
import { Home, BookOpen, Calendar, FolderOpen, BarChart2 } from "lucide-react";

export function MobileNav() {
  const isActiveRoute = (path: string) => window.location.pathname === path;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-white">
      <div className="grid grid-cols-5">
        <Link href="/">
          <a className={`flex flex-col items-center justify-center py-2 ${
            isActiveRoute("/") ? "text-blue-600" : "text-gray-600"
          }`}>
            <Home className="w-6 h-6" />
            <span className="text-xs mt-1">Home</span>
          </a>
        </Link>

        <Link href="/tasks">
          <a className={`flex flex-col items-center justify-center py-2 ${
            isActiveRoute("/tasks") ? "text-blue-600" : "text-gray-600"
          }`}>
            <BookOpen className="w-6 h-6" />
            <span className="text-xs mt-1">Tasks</span>
          </a>
        </Link>

        <Link href="/calendar">
          <a className={`flex flex-col items-center justify-center py-2 ${
            isActiveRoute("/calendar") ? "text-blue-600" : "text-gray-600"
          }`}>
            <Calendar className="w-6 h-6" />
            <span className="text-xs mt-1">Calendar</span>
          </a>
        </Link>

        <Link href="/resources">
          <a className={`flex flex-col items-center justify-center py-2 ${
            isActiveRoute("/resources") ? "text-blue-600" : "text-gray-600"
          }`}>
            <FolderOpen className="w-6 h-6" />
            <span className="text-xs mt-1">Resources</span>
          </a>
        </Link>

        <Link href="/analytics">
          <a className={`flex flex-col items-center justify-center py-2 ${
            isActiveRoute("/analytics") ? "text-blue-600" : "text-gray-600"
          }`}>
            <BarChart2 className="w-6 h-6" />
            <span className="text-xs mt-1">Analytics</span>
          </a>
        </Link>
      </div>
    </nav>
  );
}