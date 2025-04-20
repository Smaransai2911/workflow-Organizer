import { useQuery } from "@tanstack/react-query";
import { Calendar as CalendarIcon, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Event } from "@shared/schema";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, parseISO } from "date-fns";

export function CalendarPreview() {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const { data: events, isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ["/api/events", { userId: 1 }],
  });

  const getCalendarDays = () => {
    const monthStart = startOfMonth(new Date(currentYear, currentMonth, 1));
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days: Date[] = [];
    let day = startDate;

    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }

    return days;
  };

  const days = getCalendarDays();

  const hasEventOnDay = (date: Date) => {
    if (!events) return false;
    return events.some(event => isSameDay(parseISO(String(event.date)), date));
  };

  const getEventColor = (date: Date) => {
    if (!events) return "";
    
    const event = events.find(event => isSameDay(parseISO(String(event.date)), date));
    if (!event) return "";
    
    const subjectIdToColor: Record<number, string> = {
      1: "bg-green-500", // Science
      2: "bg-blue-500",  // Math
      3: "bg-purple-500", // English
      4: "bg-indigo-500", // CS
      5: "bg-amber-500", // History
      6: "bg-red-500"    // Art
    };
    
    return event.subjectId && subjectIdToColor[event.subjectId] 
      ? subjectIdToColor[event.subjectId] 
      : "bg-primary";
  };

  const getUpcomingEvents = () => {
    if (!events) return [];
    
    return events
      .filter(event => new Date(event.date) >= today)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 3);
  };

  const upcomingEvents = getUpcomingEvents();

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          {format(new Date(currentYear, currentMonth, 1), "MMMM yyyy")}
        </h3>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          <div className="text-xs font-medium text-gray-500">Sun</div>
          <div className="text-xs font-medium text-gray-500">Mon</div>
          <div className="text-xs font-medium text-gray-500">Tue</div>
          <div className="text-xs font-medium text-gray-500">Wed</div>
          <div className="text-xs font-medium text-gray-500">Thu</div>
          <div className="text-xs font-medium text-gray-500">Fri</div>
          <div className="text-xs font-medium text-gray-500">Sat</div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {days.map((day, index) => {
            const isCurrentMonth = isSameMonth(day, new Date(currentYear, currentMonth, 1));
            const isToday = isSameDay(day, today);
            const hasEvent = hasEventOnDay(day);
            const eventColor = getEventColor(day);
            
            return (
              <div 
                key={index} 
                className={`py-2 text-xs relative ${
                  isToday ? "bg-primary-100 rounded-full" : ""
                } ${
                  hasEvent ? "bg-opacity-50" : ""
                } ${
                  isCurrentMonth ? "" : "text-gray-400"
                }`}
              >
                {format(day, "d")}
                {hasEvent && (
                  <span 
                    className={`absolute bottom-0 right-0 block h-1.5 w-1.5 rounded-full ${eventColor} transform translate-y-1`}
                  ></span>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div className="px-4 py-4 sm:px-6 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Upcoming Events</h4>
        {eventsLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        ) : upcomingEvents.length > 0 ? (
          <ul className="space-y-2">
            {upcomingEvents.map((event) => {
              const eventColor = event.subjectId && getEventColor(new Date(event.date))
                ? getEventColor(new Date(event.date))
                : "bg-primary";
                
              return (
                <li key={event.id} className="flex items-center text-sm">
                  <span className={`w-2 h-2 ${eventColor} rounded-full mr-2`}></span>
                  <span className="text-gray-600">
                    {event.title} - {format(new Date(event.date), "MMM d")}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">No upcoming events</p>
        )}
      </div>
      <div className="px-4 py-3 bg-gray-50 text-right sm:px-6 rounded-b-lg">
        <Link href="/calendar">
          <Button variant="outline" size="sm" className="h-9">
            View Calendar
            <ArrowRight className="ml-1 h-5 w-5 text-gray-400" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
