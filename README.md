<div align="center">

# RCA Wizard Pro

**A professional Reinstatement Cost Assessment tool for building surveyors**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-demorcaflow.netlify.app-blue?style=for-the-badge&logo=netlify)](https://demorcaflow.netlify.app/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)

<br />

<img width="1200" alt="RCA Wizard Pro" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

</div>

---

## Overview

RCA Wizard Pro streamlines **Reinstatement Cost Assessments** — a critical process in UK property surveying where building surveyors calculate the cost to rebuild a property from the ground up. The tool replaces spreadsheet-based workflows with a guided, multi-step wizard that ensures accuracy and consistency across assessments.

> **[Try the live demo →](https://demorcaflow.netlify.app/)**

---

## Key Features

### Multi-Step RCA Wizard
A guided 7-step assessment process covering overview, rates & area, floor-by-floor breakdown, adjustments (access, party walls, storey height, listed buildings), demolition, anomalies (lifts, fire systems, parking), and a final summary with professional fees.

### Development & Block Management
Hierarchical project structure — **Developments → Blocks → Floors** — with full CRUD, duplication, archiving, favourites, and search/sort across all projects.

### External Site Assessment
Dedicated wizard for site-level externals: outbuildings, landscaping, car parks, roads, fencing, and special anomalies with a master rates database.

### Reports & Document Management
Generate professional reports from customisable Word (.docx) templates with merge field extraction, document preview, and staging workflows.

### Analytics Dashboard
Role-based analytics — **Department Heads** see team performance, gross fees, and RCA completion metrics; **Surveyors** see their personal dashboard.

### AI-Powered Assistance
Integrated Google Gemini API for intelligent rate suggestions and assessment guidance.

### Demo Mode
Full demo environment with sample developments, pre-populated data, and a role switcher to explore both Department Head and Surveyor views.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | React 19, TypeScript 5.8 |
| **Build** | Vite 6 |
| **Styling** | Tailwind CSS, Inter typeface |
| **State** | Zustand |
| **Icons** | Lucide React |
| **Docs** | mammoth (DOCX → HTML), docx-preview |
| **AI** | Google GenAI SDK (Gemini) |
| **Deploy** | Netlify (SPA) |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)

### Installation

```bash
# Clone the repository
git clone https://github.com/u-kaushik/rca-flow-portfolio.git
cd rca-flow-portfolio

# Install dependencies
npm install

# (Optional) Set your Gemini API key for AI features
echo "GEMINI_API_KEY=your_key_here" > .env.local

# Start the dev server
npm run dev
```

The app will be available at **http://localhost:3000**.

> **Note:** The app is fully functional without an API key — AI-powered features simply won't be available.

---

## Project Structure

```
├── index.html            # HTML entry point
├── index.tsx             # React entry point
├── App.tsx               # Root component & routing
├── store.ts              # Zustand state management & business logic
├── types.ts              # TypeScript interfaces
├── components/
│   ├── Sidebar.tsx               # Navigation sidebar
│   ├── ProjectManagementModal.tsx # Project create/edit modal
│   └── DeleteConfirmationModal.tsx
├── pages/
│   ├── LoginPage.tsx             # Authentication
│   ├── DashboardPage.tsx         # Project list & overview
│   ├── DevelopmentPage.tsx       # Development detail view
│   ├── ProjectMasterPage.tsx     # Block-level project view
│   ├── WizardPage.tsx            # 7-step RCA wizard
│   ├── ExternalsWizardPage.tsx   # Site externals wizard
│   ├── ReportsPage.tsx           # Report generation
│   ├── AnalyticsPage.tsx         # Analytics dashboard
│   └── SettingsPage.tsx          # User settings & preferences
└── vite.config.ts        # Vite configuration
```

---

## Live Demo

**[https://demorcaflow.netlify.app/](https://demorcaflow.netlify.app/)**

The demo includes 5 sample developments with pre-populated blocks, floors, and anomalies. Use the role switcher to explore both **Department Head** and **Surveyor** views.

---

## License

This project is proprietary. All rights reserved.
