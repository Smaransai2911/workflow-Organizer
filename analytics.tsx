
import { useQuery } from "@tanstack/react-query";
import { Card } from "../ui/card";
import { Bar, Line, Pie } from "react-chartjs-2";

export function Analytics() {
  const { data: taskStats } = useQuery({
    queryKey: ["taskStats"],
    queryFn: () => fetch("/api/tasks/stats").then(res => res.json())
  });

  const { data: subjectProgress } = useQuery({
    queryKey: ["subjectProgress"],
    queryFn: () => fetch("/api/analytics/subject-progress").then(res => res.json())
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="p-4">
        <h3 className="text-lg font-medium mb-4">Task Completion Rate</h3>
        <Bar 
          data={{
            labels: ["Completed", "Pending", "Overdue"],
            datasets: [{
              data: [
                taskStats?.completedTasks || 0,
                taskStats?.pendingTasks || 0,
                taskStats?.overdue || 0
              ],
              backgroundColor: ['#10B981', '#F59E0B', '#EF4444']
            }]
          }}
        />
      </Card>

      <Card className="p-4">
        <h3 className="text-lg font-medium mb-4">Progress by Subject</h3>
        <Pie 
          data={{
            labels: subjectProgress?.map(s => s.name) || [],
            datasets: [{
              data: subjectProgress?.map(s => s.completionRate) || [],
              backgroundColor: ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6']
            }]
          }}
        />
      </Card>
    </div>
  );
}
