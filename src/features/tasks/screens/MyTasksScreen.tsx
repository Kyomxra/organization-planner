import React from 'react';
import { DivisionTasksScreen } from './DivisionTasksScreen';
import { DivisionTask } from '../types';

interface MyTasksScreenProps {
  organizationId: string;
  userId: string;
  onOpenTask: (task: DivisionTask) => void;
}

export function MyTasksScreen({ organizationId, userId, onOpenTask }: MyTasksScreenProps) {
  return (
    <DivisionTasksScreen
      organizationId={organizationId}
      divisionId={null}
      assignedToUserId={userId}
      onOpenTask={onOpenTask}
    />
  );
}
