
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Dialog } from "../ui/dialog";

export function ResourceLibrary() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: resources } = useQuery({
    queryKey: ["resources"],
    queryFn: () => fetch("/api/resources").then(res => res.json())
  });

  const uploadResource = useMutation({
    mutationFn: (formData: FormData) =>
      fetch("/api/resources", {
        method: "POST",
        body: formData
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      setIsUploadOpen(false);
    }
  });

  const filteredResources = resources?.filter(resource =>
    resource.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Input
          type="search"
          placeholder="Search resources..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button onClick={() => setIsUploadOpen(true)}>Upload</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filteredResources?.map(resource => (
          <Card key={resource.id} className="p-4">
            <h3 className="font-medium">{resource.name}</h3>
            <p className="text-sm text-gray-500">{resource.type}</p>
            <Button variant="link" className="mt-2" onClick={() => window.open(resource.url)}>
              View Resource
            </Button>
          </Card>
        ))}
      </div>

      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        {/* Add upload form here */}
      </Dialog>
    </div>
  );
}
