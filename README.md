# Orbit — Authentication Starter (React Native + Expo)

This is a runnable Expo TypeScript app for the first Organization Planner flow, styled to follow the supplied Orbit mockup.

## Included screens

1. Splash screen — Orbit brand mark and tagline, then automatic transition to Login.
2. Login / Sign in — email, password, show/hide password, Remember me, Forgot password, and Create an account.
3. Create account / Sign up — full name, email, password, and password confirmation.
4. Forgot password — email verification code sheet, followed by Reset Password.

`Login` and `Sign in` are the same screen. `Create an account` is the sign-up screen.

## Run locally

Use Node.js 22.13 or newer, then from this folder:

```bash
npm install
npx expo start
```

Open the QR code with Expo Go (or run an Android/iOS emulator). If Expo reports a package compatibility issue, run:

```bash
npx expo install --fix
```

## Prototype limitation

This is currently a frontend prototype. It validates required fields and navigates between screens, but it does **not** create accounts, authenticate users, send email, or verify a real OTP. The Week 3 milestone has not selected a backend yet. Do not use real passwords or real user accounts in this prototype. Once the team approves a backend, replace the placeholder handlers in `src/features/auth/AuthFlow.tsx` with real authentication calls.

## Structure

```text
mobile/
  App.tsx
  app.json
  package.json
  src/
    features/auth/
      AuthFlow.tsx
      components/
        AuthTextField.tsx
        Brand.tsx
        PrimaryButton.tsx
      screens/
        LoginScreen.tsx
        SignUpScreen.tsx
        SplashScreen.tsx
    theme/colors.ts
```
