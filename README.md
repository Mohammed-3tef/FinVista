<div align="center">
    <img src="./docs/icon-rounded.png" width="150px">
</div>

<br>

# FinVista – Financial Goals & Savings Tracker

A premium fintech-style React Native app for tracking financial goals and savings.

![React Native](https://img.shields.io/badge/React%20Native-0.84-blue?logo=react)
![React](https://img.shields.io/badge/React-19.2.3-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)
![Node](https://img.shields.io/badge/Node-%3E%3D22.11-green?logo=node.js)
![Platform](https://img.shields.io/badge/Platform-Android%20%7C%20iOS-lightgrey)
![License](https://img.shields.io/badge/License-MPL-yellow)
![GitHub repo size](https://img.shields.io/github/repo-size/Mohammed-3tef/https%3A%2F%2Fgithub.com%2FMohammed-3tef%2FFinVista)

## Features

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

## Screenshots

### Demos Screenshots

| Screenshot 1 | Screenshot 2 | Screenshot 3 | Screenshot 4 | Screenshot 5 |
|--------------|--------------|--------------|--------------|--------------|
| ![Home](./docs/ui/home1.png) | ![Home](./docs/ui/home2.png) | ![All Activities](./docs/ui/all_activities.png) | ![Add Goal](./docs/ui/add_goal.png) | ![Goals](./docs/ui/goals.png) | 
| ![Goal Filteration](./docs/ui/goal_filteration.png) | ![Goal Details](./docs/ui/goal_details.png) | ![Analytics](./docs/ui/analytics.png) | ![SMS](./docs/ui/sms.png) | ![Settings](./docs/ui/settings1.png) |
| ![Settings](./docs/ui/settings2.png) | ![Settings](./docs/ui/settings3.png) | ![Light Mode](./docs/ui/light_mode.png)

### PDF Documents

| PDF 1 | PDF 2 |
|-------|-------|
|![FinVista Analytics](./docs/pdf/FinVista_Analytics.jpg) | ![FinVista Goal](./docs/pdf/FinVista_Goal.jpg) |

## Setup

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
"@fortawesome/fontawesome-svg-core": "^6.7.2",
"@fortawesome/free-brands-svg-icons": "6.7.2",
"@fortawesome/free-solid-svg-icons": "^6.7.2",
"@fortawesome/react-native-fontawesome": "^0.3.2",
"@notifee/react-native": "^9.1.8",
"@react-native-async-storage/async-storage": "^2.1.2",
"@react-native-community/datetimepicker": "^8.6.0",
"@react-navigation/bottom-tabs": "^7.3.10",
"@react-navigation/native": "^7.0.14",
"@react-navigation/native-stack": "^7.3.10",
"react": "19.2.3",
"react-native": "0.84.0",
"react-native-background-fetch": "^4.3.0",
"react-native-fs": "^2.20.0",
"react-native-get-sms-android": "^2.1.0",
"react-native-html-to-pdf": "^1.3.0",
"react-native-immersive-mode": "^2.0.2",
"react-native-safe-area-context": "^5.5.2",
"react-native-screens": "^4.4.0",
"react-native-share": "^12.2.5",
"react-native-sms-listener": "^0.0.1",
"react-native-svg": "^15.15.3",
"xlsx": "^0.18.5"
```

---

## Notifications / Reminders

Reminders are configurable in Settings. The notification messages rotate randomly from 5 templates per language and dynamically include the goal name.

> **Note:** For actual push notifications, integrate `@notifee/react-native` or `react-native-push-notification` and wire the `scheduleReminder()` function in `src/services/notifications.ts` to the chosen library's scheduling API.

