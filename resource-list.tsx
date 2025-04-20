import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Resource, Subject } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileText, Image, FileIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export interface ResourceWithSubject extends Resource {
  subject: Subject;
}

export function ResourceList() {
  const { data: resources, isLoading } = useQuery<ResourceWithSubject[]>({
    queryKey: ["/api/resources/recent", { userId: 1 }],
  });

  const getResourceIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return <FileText className="h-6 w-6 text-red-500" />;
      case "image":
        return <Image className="h-6 w-6 text-blue-500" />;
      case "document":
        return <FileIcon className="h-6 w-6 text-green-500" />;
      default:
        return <FileIcon className="h-6 w-6 text-gray-500" />;
    }
  };

  const getResourceTypeLabel = (type: string) => {
    switch (type) {
      case "pdf":
        return "PDF";
      case "image":
        return "Image";
      case "document":
        return "Document";
      case "video":
        return "Video";
      case "link":
        return "Link";
      default:
        return "File";
    }
  };

  const formatUpdatedTime = (date: Date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  return (
    <div className="mt-8 bg-white shadow rounded-lg mb-8">
      <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Recent Resources
        </h3>
      </div>
      <div className="p-4">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-gray-200 rounded-md p-4">
                <Skeleton className="h-6 w-6 mb-3" />
                <Skeleton className="h-4 w-3/4 mb-1" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : resources && resources.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {resources.map((resource) => (
              <div 
                key={resource.id} 
                className="border border-gray-200 rounded-md p-4 hover:border-primary transition-colors cursor-pointer"
              >
                <div className="flex items-center mb-3">
                  {getResourceIcon(resource.type)}
                  <span className="ml-2 text-sm font-medium text-gray-700">
                    {getResourceTypeLabel(resource.type)}
                  </span>
                </div>
                <h4 className="text-sm font-medium text-primary">{resource.name}</h4>
                <p className="mt-1 text-xs text-gray-500">
                  {resource.subject.name} • Updated {formatUpdatedTime(resource.updatedAt)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-gray-500">No resources found.</p>
          </div>
        )}
      </div>
      <div className="px-4 py-3 bg-gray-50 text-right sm:px-6 rounded-b-lg">
        <Link href="/resources">
          <Button variant="outline" size="sm" className="h-9">
            View All Resources
            <ArrowRight className="ml-1 h-5 w-5 text-gray-400" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
