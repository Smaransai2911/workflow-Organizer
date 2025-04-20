
import React from "react";
import Link from "next/link";
import { LogOut, Menu, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";
import { useAuth } from "../../hooks/use-auth";

export function MobileNav() {
  const { user, logoutMutation } = useAuth();

  return (
    <Sheet>
      <SheetTrigger asChild className="fixed right-4 top-4 z-40 md:hidden">
        <button className="p-2">
          <Menu className="h-6 w-6" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <nav className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b p-4">
            <span className="text-lg font-semibold">Menu</span>
            <SheetTrigger>
              <X className="h-5 w-5" />
            </SheetTrigger>
          </div>
          {/* Navigation Links */}
          <div className="flex-1 overflow-auto py-4">
            <Link href="/dashboard">
              <a className="block px-4 py-2 hover:bg-gray-100">Dashboard</a>
            </Link>
            <Link href="/tasks">
              <a className="block px-4 py-2 hover:bg-gray-100">Tasks</a>
            </Link>
            <Link href="/calendar">
              <a className="block px-4 py-2 hover:bg-gray-100">Calendar</a>
            </Link>
            <Link href="/resources">
              <a className="block px-4 py-2 hover:bg-gray-100">Resources</a>
            </Link>
            <Link href="/analytics">
              <a className="block px-4 py-2 hover:bg-gray-100">Analytics</a>
            </Link>
          </div>
          {/* User Section */}
          <div className="border-t p-4">
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 font-semibold text-white">
                {user?.displayName?.charAt(0).toUpperCase() || user?.username?.charAt(0).toUpperCase()}
              </div>
              <span className="font-medium">{user?.displayName || user?.username}</span>
            </div>
            <button
              onClick={() => logoutMutation.mutate()}
              className="flex w-full items-center px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Logout
            </button>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
