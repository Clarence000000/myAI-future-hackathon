# FinTrust AI: Intelligent Fintech Security Platform 🛡️

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![Google Cloud](https://img.shields.io/badge/Google_Cloud-4285F4?style=for-the-badge&logo=google-cloud&logoColor=white)
![Google Cloud Run](https://img.shields.io/badge/Google_Cloud_Run-4285F4?style=for-the-badge&logo=googlecloudrun&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white)
![Google AI Studio](https://img.shields.io/badge/Google_AI_Studio-4285F4?style=for-the-badge&logo=google&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Antigravity](https://img.shields.io/badge/Antigravity-000000?style=for-the-badge&logo=spacex&logoColor=white)

**FinTrust AI** is a centralized fintech security ecosystem designed to provide multi-layered protection against digital fraud. By leveraging the **Google AI Ecosystem Stack**, the platform transitions from simple scam detection to autonomous security intelligence, specifically tailored for the Malaysian and Southeast Asian financial landscape.

## 🏗️ Architectural Overview

```mermaid
graph TD
    subgraph ClientLayer [Client Layer]
        Ext[Chrome Extension]
        Web[Web Dashboard - Next.js]
    end

    subgraph AppLayer [Application Layer - Google Cloud Run]
        Dashboard[Insight Dashboard]
        Module1[ScamShield AI]
        Module2[IdentityGuard AI]
        Module3[FraudTransaction AI]
    end

    subgraph AILayer [AI Intelligence Layer]
        Gemini[Google Gemini 2.0]
    end

    subgraph DataLayer [Data & Security Layer]
        Auth[Firebase Auth]
        DB[(Firebase Firestore)]
        Storage[Firebase Storage]
    end

    Ext -->|API Requests| Module1
    Web --> Dashboard
    Dashboard --> Module1
    Dashboard --> Module2
    Dashboard --> Module3

    Module1 --> Gemini
    Module2 --> Gemini
    Module3 --> Gemini

    Module1 --> DB
    Module2 --> DB
    Module2 --> Storage
    Module3 --> DB
    
    Web --> Auth
    Ext --> Auth
```

FinTrust AI is a modular intelligence hub that aggregates data from specialized security modules into a unified **Insight Dashboard**, providing a "Single Source of Truth" for fintech security.

### Core Modules

1.  **ScamShield AI (NLP Reasoning):** Uses Gemini 2.0 to detect scam intent in text/URLs and identifies "Quishing" (QR scams).
2.  **IdentityGuard AI (Vision Intelligence):** A digital risk analyzer using Gemini Vision for face verification and document authenticity analysis to prevent deepfakes and identity theft.
3.  **FraudTransaction (Pattern Analysis):** Uses AI to detect fraudulent transaction patterns and flag high-risk anomalies in real-time.

## 🛠️ The "Build With AI" Tech Stack

*   **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS.
*   **Backend:** Firebase Firestore (Storage), Firebase Auth (Security), Next.js API Routes (Logic).
*   **AI Layer:** Google Gemini 2.0 (NLP Reasoning, Vision Intelligence, and AI Summarization).
*   **Chrome Extension:** Real-time web protection using Manifest V3 and Shadow DOM.
*   **Deployment:** Fully containerized and deployed on Google Cloud Run.

## 🚀 Key Features

### 1. ScamShield AI & Chrome Extension
*   **Real-time Analysis:** Analyze suspicious texts, URLs, and emails with one click.
*   **Intent Detection:** Distinguish between legitimate marketing and malicious social engineering.
*   **Quishing Protection:** Vision-based scanning for malicious QR code redirects.
*   **Unified Logging:** All threats detected via the extension are persisted to the central dashboard.

### 2. IdentityGuard AI
*   **Deepfake Detection:** Analyze facial frames to calculate liveness and synthetic probability.
*   **Document Verification:** Automated authenticity analysis for ID documents.
*   **Forensic Registry:** Detailed audit logs for every identity verification attempt.

### 3. FraudTransaction Monitoring
*   **Behavioral Baselining:** Identifies anomalies based on established spending patterns.
*   **Investigation Mode:** Specialized UI for security analysts to deep-dive into suspicious transaction chains.

## 📈 Impact & Strategic Alignment

*   **Actionable Intelligence:** Transitions security from passive alerts to actionable insights through risk scoring.
*   **Malaysian Context:** Specifically optimized for local fraud patterns (Mule accounts, e-wallet phishing).
*   **National Security:** Addresses the "Secure Digital" challenge by protecting citizens from multi-million dollar annual losses.

## 🛡️ Responsible AI & Security

*   **Privacy First:** PII is encrypted at rest in Firestore.
*   **Reasoning Path:** AI-generated risk scores include a detailed explanation of the underlying logic for transparency.
*   **Ethical Alignment:** Adheres to Google’s AI Principles for unbiased risk assessment.

---
**Developed for Project 2030 by Group Alfred_67**
