# COMPLETE MERMAID ARCHITECTURE DIAGRAM

Copy and paste the code block below directly into [Mermaid Live Editor](https://mermaid.live) or any Markdown viewer to render the complete visual module diagram for your project presentation:

```mermaid
graph TD
    %% 👥 USER ROLES & ACCESS CONTROL
    subgraph ROLES ["👥 USER ROLES (3-PILLAR ECOSYSTEM)"]
        D["🩸 VOLUNTARY DONOR<br>(Availability 🟢/🔴 | 90-Day Recovery | Passport)"]
        H["🏥 CENTRAL HOSPITAL & BLOOD BANK<br>(Stock Inventory | Emergency Dispatch | Donor Verification)"]
        A["👨‍💼 SYSTEM ADMIN<br>(KPI Overview | Recharts Analytics | Moderation)"]
    end

    %% 💻 REACT FRONTEND MODULES
    subgraph FRONTEND ["💻 REACT + VITE FRONTEND LAYER"]
        M1["🔑 MOD-01: Auth & RBAC<br>(Register, Login, 1-Click Demo Switcher)"]
        M3["🩸 MOD-03: Donor Dashboard<br>(Status Toggle, 90-Day Timer, Alert Feed)"]
        M5["🔍 MOD-05: Find Blood & Stock Inquiry<br>(Live Stock Search & Privacy Radius Masking)"]
        M6["🗺️ MOD-06: Interactive Leaflet Map<br>(Custom Pins: Donor Radius, Hospital, Dispatch)"]
        M7["🏥 MOD-07: Central Hospital Control<br>(8-Group Stock Meters & Donor Verification)"]
        M8["👨‍💼 MOD-08: Admin Recharts Dashboard<br>(Demand vs Supply Analytics & System KPIs)"]
        M9["🔔 MOD-09: Notifications Hub<br>(Socket.IO Emergency Broadcast Alerts)"]
    end

    %% 🧠 CORE PROCESSING ENGINES
    subgraph ENGINE ["🧠 SYSTEM CORE LOGIC & ALGORITHMS"]
        E1["🩸 RBC Compatibility Engine<br>(Biological RBC Transfusion Safety Matrix)"]
        E2["📍 Haversine Distance & Priority Scoring<br>(Score = GroupMatch + Proximity + Status)"]
        E3["🤖 Auto 90-Day Re-Engagement Engine<br>(Automated Post-Recovery Invitation Trigger)"]
    end

    %% ⚡ BACKEND & DATABASE LAYER
    subgraph BACKEND ["⚡ NODE.JS + EXPRESS + MONGODB ATLAS"]
        API["🔌 Express.js REST API Server"]
        WS["⚡ Socket.IO Real-Time Dispatcher"]
        DB[("🗄️ MongoDB Atlas Database<br>(Users, Donors, Hospital, Requests, Inventory)")]
    end

    %% CONNECTIONS & DATA FLOW
    D -->|Authenticates| M1
    D -->|Toggles Status & Views Passport| M3
    H -->|Manages 8-Group Stock| M7
    H -->|Issues Emergency Dispatch| M7
    A -->|Monitors Recharts Stats| M8

    M7 -->|Triggers Emergency Broadcast| E1
    E1 -->|Checks RBC Compatibility| E2
    E2 -->|Calculates Proximity & Ranks Donors| API
    API -->|Dispatches WebSockets Alert| WS
    WS -->|Pushes Real-time Notification| M9
    M9 -->|Alerts Donor| M3
    M3 -->|Clicks 'I am Available'| API
    API -->|Updates Live Progress| M7

    E3 -->|Auto-Triggers on 90 Days| WS
    WS -->|Sends Celebration Invitation| M3

    M6 <-->|Loads Geo-Coordinates| API
    API <--> DB
```
