# EcoTrace UI

EcoTrace UI is tracking application built with React Native and Expo.

## 🚀 Prerequisites

Before you begin, ensure you have the following installed:

1.  **Node.js**: [Download and install Node.js](https://nodejs.org/) (LTS version recommended).
2.  **Expo Go App**: Download the "Expo Go" app on your mobile device:
    *   **Android**: [Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
    *   **iOS**: [App Store](https://apps.apple.com/us/app/expo-go/id982107779)

## 📦 Installation

1.  Clone the repository and run the content commands in the project directory:

    ```bash
    npm install
    ```

## 🏃‍♂️ Running the App

1.  Start the development server:

    ```bash
    npx expo start
    ```
    *(or `npm start`)*

2.  **On your mobile device**:
    *   Open the **Expo Go** app.
    *   **Android**: Scan the QR code displayed in your terminal.
    *   **iOS**: Use the default Camera app to scan the QR code, which will open Expo Go.

3.  **Troubleshooting**:
    *   If the QR code doesn't appear, press `c` in the terminal to show it.
    *   Make sure your phone and computer are on the **same Wi-Fi network**.

## � Project Structure

*   `screens/`: Main application screens (Auth, Observation, Results, etc.)
*   `components/`: Reusable UI components
*   `navigation/`: Navigation configuration
*   `store/`: Redux state management
