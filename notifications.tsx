
import { useEffect } from "react";
import { toast } from "../ui/toast";
import { useQuery } from "@tanstack/react-query";

export function NotificationCenter() {
  const { data: tasks } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => fetch("/api/tasks").then(res => res.json())
  });

  useEffect(() => {
    if (Notification.permission !== 'granted') {
      Notification.requestPermission();
    }

    // Check for upcoming deadlines
    const checkDeadlines = () => {
      tasks?.forEach(task => {
        const dueDate = new Date(task.dueDate);
        const now = new Date();
        const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (hoursUntilDue <= 24 && !task.isCompleted) {
          toast({
            title: "Upcoming Deadline",
            description: `${task.title} is due in ${Math.round(hoursUntilDue)} hours`,
            variant: "destructive"
          });

          // Browser notification
          if (Notification.permission === 'granted') {
            new Notification(`Deadline Alert: ${task.title}`, {
              body: `Due in ${Math.round(hoursUntilDue)} hours`
            });
          }
        }
      });
    };

    const interval = setInterval(checkDeadlines, 1800000); // Check every 30 minutes
    return () => clearInterval(interval);
  }, [tasks]);

  return null; // This component handles notifications in the background
}
