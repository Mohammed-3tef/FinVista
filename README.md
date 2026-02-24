# 💎 FinVista – Financial Goals & Savings Tracker

A premium fintech-style React Native app for tracking financial goals and savings.

---

## ✨ Features

- **Financial Goals Management** – Create, edit, delete goals with name, target amount, start date, and deadline
- **Savings Tracking** – Add, edit, delete savings entries with full history per goal
- **Real-time Calculations** – Daily, weekly, and monthly savings needed; progress percentage; days left
- **Analytics Dashboard** – Total saved, average per entry, goal breakdown with progress bars
- **Dark / Light Mode** – Manual toggle, persisted via AsyncStorage
- **Arabic & English** – Full RTL layout support for Arabic, language persisted
- **Motivational Reminders** – Settings for frequency (daily/weekly/monthly), random bilingual messages
- **Animated Progress Bars** – Spring animations on progress updates
- **Confirmation Modals** – Safe delete flows for goals and entries

---

## 📁 Project Structure

```
FinVista/
├── App.tsx                      # Root component with providers
├── index.js                     # Entry point
├── app.json                     # App config
├── package.json                 # Dependencies
└── src/
    ├── constants/
    │   ├── theme.ts             # Colors, spacing, radii, font sizes
    │   └── strings.ts           # EN + AR localization strings
    ├── contexts/
    │   ├── ThemeContext.tsx      # Dark/light mode context
    │   ├── LanguageContext.tsx   # Language & RTL context
    │   └── GoalsContext.tsx      # Goals & entries state + AsyncStorage
    ├── services/
    │   └── notifications.ts     # Reminder settings & motivational messages
    ├── utils/
    │   └── calculations.ts      # Financial math utilities + types
    ├── components/
    │   ├── Card.tsx             # Themed card container
    │   ├── Button.tsx           # Multi-variant button
    │   ├── TextInput.tsx        # Themed labeled input
    │   ├── ProgressBar.tsx      # Animated spring progress bar
    │   ├── GoalCard.tsx         # Goal summary card
    │   └── ConfirmModal.tsx     # Delete confirmation modal
    ├── screens/
    │   ├── DashboardScreen.tsx  # Overview: total saved, goals list, activity
    │   ├── GoalsScreen.tsx      # Goals list tab
    │   ├── GoalDetailScreen.tsx # Goal detail + savings history
    │   ├── GoalFormScreen.tsx   # Create/edit goal form
    │   ├── AnalyticsScreen.tsx  # Analytics & breakdown
    │   └── SettingsScreen.tsx   # Theme, language, reminder settings
    └── navigation/
        └── AppNavigator.tsx     # Bottom tabs + stack navigator
```

---

## 🚀 Setup

### Prerequisites
- Node.js >= 22.11.0
- React Native CLI environment set up ([guide](https://reactnative.dev/docs/set-up-your-environment))

### Install

```bash
cd FinVista
npm install

# iOS
cd ios && pod install && cd ..
npx react-native run-ios

# Android
npx react-native run-android
```

### Dependencies added vs template

```json
"@react-native-async-storage/async-storage": "^2.1.2",
"@react-navigation/native": "^7.0.14",
"@react-navigation/bottom-tabs": "^7.3.10",
"@react-navigation/native-stack": "^7.3.10",
"react-native-screens": "^4.4.0",
"react-native-safe-area-context": "^5.5.2"
```

---

## 🎨 Design System

| Token | Value |
|-------|-------|
| Primary | `#1A2744` (Deep Navy) |
| Accent | `#F0B429` (Gold) |
| Success | `#10B981` (Green) |
| Danger | `#EF4444` (Red) |
| Info | `#3B82F6` (Blue) |

---

## 📱 Screens

| Screen | Description |
|--------|-------------|
| Dashboard | Hero total saved card, goals list, recent savings activity |
| Goals | All goals with progress cards |
| Goal Detail | Full goal view: progress, savings needed, savings history with edit/delete |
| Goal Form | Create or edit a goal (modal presentation) |
| Analytics | Stats grid, most-progress highlight, per-goal breakdown |
| Settings | Dark mode toggle, EN/AR language switch, reminder frequency |

---

## 🔔 Notifications / Reminders

Reminders are configurable in Settings. The notification messages rotate randomly from 5 templates per language and dynamically include the goal name.

> **Note:** For actual push notifications, integrate `@notifee/react-native` or `react-native-push-notification` and wire the `scheduleReminder()` function in `src/services/notifications.ts` to the chosen library's scheduling API.

