import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

interface SubjectWorkload {
  subjectId: number;
  subjectName: string;
  color: string;
  count: number;
}

export function WorkloadChart() {
  const { data: workloadData, isLoading } = useQuery<SubjectWorkload[]>({
    queryKey: ["/api/analytics/tasks-by-subject", { userId: 1 }],
  });

  const getColorClass = (color: string) => {
    const colorMap: Record<string, string> = {
      green: "bg-green-500",
      blue: "bg-blue-500",
      purple: "bg-purple-500",
      indigo: "bg-indigo-500",
      amber: "bg-amber-500",
      red: "bg-red-500",
      pink: "bg-pink-500",
      cyan: "bg-cyan-500",
      teal: "bg-teal-500",
      orange: "bg-orange-500"
    };
    return colorMap[color] || "bg-gray-500";
  };

  // Find max count for chart scaling
  const maxCount = workloadData?.reduce((max, item) => Math.max(max, item.count), 0) || 0;

  // Calculate height percentage for each bar
  const getBarHeight = (count: number) => {
    if (maxCount === 0) return 0;
    return Math.max((count / maxCount) * 100, 10); // Min height of 10% for visibility
  };

  // Sort by count descending
  const sortedData = [...(workloadData || [])].sort((a, b) => b.count - a.count);

  return (
    <div className="mt-8 bg-white shadow rounded-lg">
      <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Workload Analysis
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Visualize your task distribution by subject
        </p>
      </div>
      {isLoading ? (
        <div className="p-4">
          <div className="flex items-end justify-between px-4 h-64">
            <Skeleton className="h-3/4 w-16" />
            <Skeleton className="h-full w-16" />
            <Skeleton className="h-1/2 w-16" />
            <Skeleton className="h-2/3 w-16" />
            <Skeleton className="h-1/3 w-16" />
            <Skeleton className="h-1/4 w-16" />
          </div>
        </div>
      ) : sortedData && sortedData.length > 0 ? (
        <div className="p-4">
          <div className="h-64 flex items-end justify-between px-4">
            {sortedData.map((item) => (
              <div key={item.subjectId} className="flex flex-col items-center" style={{ width: `${100 / Math.min(sortedData.length, 6)}%` }}>
                <div 
                  className={`chart-bar ${getColorClass(item.color)} w-16`} 
                  style={{ height: `${getBarHeight(item.count)}%` }}
                ></div>
                <span className="mt-2 text-xs text-gray-500">{item.subjectName}</span>
                <span className="text-xs font-medium">{item.count} tasks</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-8 text-center">
          <p className="text-gray-500">No workload data available.</p>
        </div>
      )}
      <div className="px-4 py-4 sm:px-6 border-t border-gray-200">
        {sortedData && sortedData.length > 0 && (
          <p className="text-sm text-gray-500">
            You have the most tasks in {sortedData[0]?.subjectName} ({sortedData[0]?.count}) 
            {sortedData[1] && ` and ${sortedData[1]?.subjectName} (${sortedData[1]?.count})`}. 
            Consider allocating more time to these subjects.
          </p>
        )}
      </div>
    </div>
  );
}
