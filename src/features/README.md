# Feature modules

Each major app feature belongs in its own folder under `src/features/`.

Suggested structure as the team adds screens:

```text
features/
  auth/            # Splash, login, sign up, password recovery
  dashboard/       # Home dashboard and summary cards
  organization/    # Create/join organization and invitations
  divisions/       # Divisions and members
  tasks/           # Task creation, assignment, status and details
  calendar/        # Deadlines and calendar views
  notes/           # Notes and visibility permissions
  vendors/         # Vendor/partner directory and selection
  notifications/   # In-app notifications
```

Inside each feature, keep page-level components in `screens/`, reusable feature UI in `components/`, API calls in `services/`, and feature-specific helpers in `utils/` when needed. Do not put every screen into `App.tsx`.
