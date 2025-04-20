import { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Task } from "../../shared/schema";
import { formatDistance } from "date-fns";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";

export function TaskList() {
  const queryClient = useQueryClient();
  const { data: tasks, isLoading } = useQuery<Task[]>({
    queryKey: ["tasks"],
    queryFn: () => fetch("/api/tasks").then(res => res.json())
  });

  const updateTask = useMutation({
    mutationFn: (updatedTask: Task) => 
      fetch(`/api/tasks/${updatedTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTask)
      }).then(res => res.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] })
  });

  const onDragEnd = (result: any) => {
    if (!result.destination || !tasks) return;

    const items = Array.from(tasks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update task positions
    items.forEach((task, index) => {
      updateTask.mutate({ ...task, position: index });
    });
  };

  if (isLoading) return <div>Loading tasks...</div>;

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="tasks">
        {(provided) => (
          <div {...provided.droppableProps} ref={provided.innerRef}>
            {tasks?.map((task, index) => (
              <Draggable key={task.id} draggableId={String(task.id)} index={index}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className="bg-white p-4 mb-2 rounded-lg shadow"
                  >
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium">{task.title}</h3>
                      <Badge variant={task.priority === "high" ? "destructive" : "default"}>
                        {task.priority}
                      </Badge>
                    </div>
                    <Progress value={task.progress} className="mt-2" />
                    <div className="text-sm text-gray-500 mt-2">
                      Due {formatDistance(new Date(task.dueDate), new Date(), { addSuffix: true })}
                    </div>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}