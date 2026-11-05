# Organization Planner — Mobile App

React Native + Expo + TypeScript application for the Group 6 Organization Planner project.

## Current implementation

The first implementation follows the supplied Orbit authentication mockups:

- Splash screen → Login
- Sign in form with email, password, remember me and show/hide password
- Create account form
- Forgot password email verification sheet with six-digit code UI
- Reset password sheet

Authentication is currently a **frontend prototype only**. It does not create accounts, authenticate users, send email, or validate a real OTP. The team has not selected a backend in the Week 3 milestone.

## Requirements

- Node.js 22.13 or newer
- npm

## Run in browser on your laptop

From this `mobile` folder:

```bash
npm install
npx expo install react-dom react-native-web @expo/metro-runtime
npx expo start --web
```

To run the native Expo development server instead:

```bash
npx expo start
```

## Project structure

```text
mobile/
  App.tsx
  app.json
  package.json
  src/
    features/
      auth/
        AuthFlow.tsx          # Composes authentication screens
        hooks/
          useAuthFlow.ts      # Auth state and form actions
        components/           # Reusable auth UI components
        screens/              # One file per authentication screen
        utils/                # Validation and feedback helpers
    theme/
      colors.ts               # Shared color palette
```

As the project grows, create one folder per major module under `src/features/`. See `src/features/README.md` for the team's suggested module map.

## Team workflow

The team can collaborate on `main` if desired. Before starting work, run `git pull origin main`. Make focused commits and push regularly. Avoid editing the same files at the same time, especially `App.tsx`, shared components, theme files, and package configuration. If two people edit the same file, coordinate and resolve Git conflicts before pushing.

## Code organization rules

- Keep `App.tsx` as a small application entry point.
- Put each screen in its own file under the relevant feature's `screens/` folder.
- Put reusable UI in `components/`.
- Put validation, formatting, and other pure helpers in `utils/`.
- Put backend/API integration in a feature's `services/` folder when a backend is selected.
- Use TypeScript and keep component/file names in PascalCase.
