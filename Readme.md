# 🛡️ Secure Exam Browser System

A controlled examination environment designed to prevent malpractice during online exams by enforcing strict application focus and monitoring student behavior.

---

## 📌 Problem Statement

In online examinations, one major challenge is ensuring that students do not:

- Switch tabs or applications  
- Access unauthorized resources  
- Leave the exam environment  

This project solves that by creating a secure, monitored browser system where:

- Students are locked into a controlled browser  
- Any attempt to leave the exam triggers:
  - Screenshot capture  
  - Security violation report  
  - Forced shutdown of the exam session  

---

## 🏗️ System Architecture

The system is divided into three core components:

### 1. Student Secure Browser (Electron App)
- A custom browser built using Electron  
- Runs in kiosk mode (full-screen, no OS access)  
- Monitors focus and prevents app switching  

### 2. Teacher Portal
- Interface for:
  - Registering students  
  - Creating exams  
  - Monitoring violations  

### 3. Backend Server
- Handles:
  - Authentication  
  - Exam session management  
  - Receiving violation reports  
  - Storing screenshots  

---

## 🔄 How the System Works

1. Teacher creates exam and assigns students  
2. Student logs into Secure Browser  
3. Browser enters secure (kiosk) mode  
4. During exam:
   - If student stays → normal operation  
   - If student leaves → violation is triggered  

---

## 🔐 Core Security Mechanism

### Focus Monitoring Logic

The browser continuously listens for:

- `blur` → app lost focus  
- `focus` → app regained focus  

### Violation Flow

---

## ⏱️ Why a Timer?

A 1.5 second delay is used to:

- Avoid false triggers (accidental clicks)  
- Allow screenshot capture  
- Ensure network request completes  

---

## 📸 Screenshot Capture System

Uses Electron APIs:

- `desktopCapturer`  
- `screen`  

### Flow

---

## 🔁 IPC Communication

Electron has two processes:

- Main Process → system-level access  
- Renderer Process → UI  

IPC is used because:

- Renderer cannot directly access system APIs  
- Main process acts as a secure bridge  

---

## 🧩 Key Components

### `foregroundMonitor.cjs`

Responsibility: Detect if student leaves the exam

- Listens to:
  - `browser-window-blur`
  - `browser-window-focus`

- Triggers:
  - Shutdown on blur  
  - Cancel shutdown on focus  

---

### `blockApi.cjs`

Responsibility: Handle security violations

- Captures screenshot (optional)  
- Sends structured violation event  

Uses a unified function:

```js
reportSecurityViolation(...)