import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import type { Task, TaskStatus, User } from '../../types';
import { TaskCard } from './TaskCard';
import styles from './KanbanBoard.module.css';

const COLUMNS: { status: TaskStatus; label: string; accent: string }[] = [
  { status: 'todo',        label: 'To Do',       accent: 'var(--text-muted)' },
  { status: 'in_progress', label: 'In Progress',  accent: 'var(--info)' },
  { status: 'done',        label: 'Done',         accent: 'var(--success)' },
];

interface KanbanBoardProps {
  tasks: Task[];
  users: User[];
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onReorder: (tasks: Task[]) => void;
}

export function KanbanBoard({
  tasks,
  users,
  onStatusChange,
  onEdit,
  onDelete,
  onReorder,
}: KanbanBoardProps) {
  const tasksByStatus = (status: TaskStatus) =>
    tasks.filter((t) => t.status === status);

  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    const srcStatus = source.droppableId as TaskStatus;
    const dstStatus = destination.droppableId as TaskStatus;
    const srcIndex = source.index;
    const dstIndex = destination.index;

    if (srcStatus === dstStatus && srcIndex === dstIndex) return;

    // Build updated flat task list preserving column order
    const colMap: Record<TaskStatus, Task[]> = {
      todo: [...tasksByStatus('todo')],
      in_progress: [...tasksByStatus('in_progress')],
      done: [...tasksByStatus('done')],
    };

    const [moved] = colMap[srcStatus].splice(srcIndex, 1);
    const updatedTask: Task = { ...moved, status: dstStatus };
    colMap[dstStatus].splice(dstIndex, 0, updatedTask);

    const newTasks = [
      ...colMap['todo'],
      ...colMap['in_progress'],
      ...colMap['done'],
    ];

    // Optimistic reorder
    onReorder(newTasks);

    // If status changed, call the API
    if (srcStatus !== dstStatus) {
      onStatusChange(draggableId, dstStatus);
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className={styles.board}>
        {COLUMNS.map((col) => {
          const colTasks = tasksByStatus(col.status);
          return (
            <div key={col.status} className={styles.column}>
              <div className={styles.columnHeader}>
                <div className={styles.columnLeft}>
                  <span
                    className={styles.columnDot}
                    style={{ background: col.accent }}
                  />
                  <span className={styles.columnLabel}>{col.label}</span>
                </div>
                <span className={styles.columnCount}>{colTasks.length}</span>
              </div>

              <Droppable droppableId={col.status}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`${styles.columnBody} ${
                      snapshot.isDraggingOver ? styles.draggingOver : ''
                    }`}
                  >
                    {colTasks.length === 0 && !snapshot.isDraggingOver && (
                      <div className={styles.columnEmpty}>
                        Drop tasks here
                      </div>
                    )}
                    {colTasks.map((task, index) => (
                      <Draggable
                        key={task.id}
                        draggableId={task.id}
                        index={index}
                      >
                        {(dragProvided, dragSnapshot) => (
                          <div
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            {...dragProvided.dragHandleProps}
                            className={`${styles.draggable} ${
                              dragSnapshot.isDragging ? styles.dragging : ''
                            }`}
                          >
                            <TaskCard
                              task={task}
                              users={users}
                              onEdit={onEdit}
                              onDelete={onDelete}
                              onStatusChange={onStatusChange}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}
