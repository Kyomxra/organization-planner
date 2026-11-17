export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'ongoing' | 'completed';

export interface DivisionTask {
  id: string;
  organization_id: string;
  division_id: string;
  division_name?: string;
  title: string;
  description: string;
  instructions: string;
  due_at: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  progress_update: string;
  assignee_user_id: string | null;
  assignee_name: string;
  updated_at: string;
}

export interface DivisionPerson {
  membershipId: string;
  userId: string;
  name: string;
  email: string;
  role: 'coordinator' | 'member' | 'executive';
  assignedTasks: number;
  completedTasks: number;
}
