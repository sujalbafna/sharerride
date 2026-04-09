# ShareRide: Your Social Safety Companion - Comprehensive Project Report

**Developed by:** Sujal Bafna  
**Institution:** MIT Art, Design & Technology University  
**Target Audience:** Creiya Evaluation Team  
**Date:** February 2025

---

## 1. Executive Summary
ShareRide is a social-safety platform designed to transform university transit from a solo vulnerability into a secure, shared, and monitored experience. Built specifically for the MIT ADT community, the platform leverages real-time GPS synchronization, Generative AI (Genkit), and "Trusted Circles" to ensure no student or faculty member ever has to travel alone.

---

## 2. The Core Problem: The "Safety Gap"
Generic navigation tools (like Google Maps) focus on **Pathfinding Efficiency**—getting you from point A to point B. They do not address **Personal Safety**—ensuring you arrive there safely.

### Key Problems Solved:
1.  **The Anxiety Gap**: Solves the psychological stress of traveling alone in low-light environments through "Virtual Companionship."
2.  **The Latency Gap**: Bypasses slow manual alerts with a "Zero-Latency SOS Protocol" (1-tap notification, 3-second hold for SMS).
3.  **The Trust Deficit**: Replaces global tracking apps with a community-restricted, privacy-first social graph.
4.  **The Isolation Factor**: Facilitates "Safe Carpooling" or "Walking Groups" via Companion Mode.
5.  **The Context Gap**: Alerts include full context—rider origin, destination, vehicle details, and live coordinates.

---

## 3. Core Features for Users

### 🛡️ Trusted Friend Circle
Users choose exactly who can see their location. Connections are verified within the university network, ensuring data is only shared with trusted peers.

### 📍 Live Journey Tracking (The "Shrinking Blue Line")
A professional-grade UI where the navigation route recalculates from the rider's *current live position*. As the rider moves, the blue line shrinks, giving companions a precise real-time tracking experience.

### 🚗 Companion Mode & Meeting Points
Broadcast an itinerary to the network. Friends can request to join the transit. The system supports **Multi-Point Safety**, rendering unique markers for each companion and rerouting the "blue line" through every rendezvous point automatically.

### 🚨 Rapid SOS Protocol
In a crisis, a simple tap notifies the network via the app. A 3-second hold triggers a system-level SMS dispatch, ensuring coordinates reach guardians even in areas with poor data connectivity.

---

## 4. Technical Architecture & Excellence
ShareRide is built on a modern **Serverless Mesh Architecture**, combining low-latency NoSQL databases with Generative AI.

### Technology Stack:
- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS, Shadcn UI.
- **Backend-as-a-Service**: Google Firebase (Firestore, Auth, Storage, Hosting).
- **AI Integration**: Firebase Genkit with Google Gemini 2.5 Flash.
- **Mapping**: Google Maps JavaScript API (Directions, Places, Geometry).

### Technical Innovations:
- **Real-time Sync Layer**: Utilizing Firestore’s WebSocket-based listeners (`onSnapshot`) for sub-200ms latency updates.
- **Intelligent Safety Analysis**: AI analyzes route coordinates to suggest optimal rendezvous locations based on street activity and friend proximity.
- **3-Way Security Protocol**: A cryptographic handshake ensures the identity of assistants in the "Extended Network" is validated by both the rider and a mutual contact.

---

## 5. Market Relevance (IDEO Framework)

### Desirability (The Human Lens)
Fulfills the emotional need for peace of mind. It transforms a lonely walk into a monitored, shared experience without compromising personal privacy during downtime.

### Feasibility (The Technical Lens)
Highly scalable due to its serverless nature. Accessible via any mobile browser, eliminating the friction of requiring a native app download.

### Viability (The Business Lens)
Operates on an ultra-low OPEX model. By utilizing the Firebase Spark Tier, the project can support up to 500 active users with zero infrastructure costs during the pilot phase.

---

## 6. Financial Summary (INR)
- **One-time Development Cost**: ₹1,80,000 (UI/UX, Backend, AI Integration).
- **Recurring Monthly OPEX**: ₹7,600 - ₹15,100 (Domain, Google Maps API, AI Tokens).
- **Strategic Advantage**: Zero idle cost—you only pay for the resources consumed.

---

## 7. Scalability & Future Roadmap
- **Current Capacity**: Configured for 50,000 Monthly Active Users via Firebase.
- **Phase 1 (Prototyping)**: Core tracking and Trusted Circle logic (Complete).
- **Phase 2 (Pilot)**: Rollout to 200 users at MIT ADT.
- **Phase 3 (Optimization)**: Refining AI meeting point algorithms.
- **Phase 4 (Scale)**: University-wide rollout with admin dashboard.

---

## 8. Appendix: Presentation Script

**(Opening)**: "Good morning, Team Creiya. Imagine it’s 11:30 PM on campus. A student is walking back from the library. Google Maps tells them *where* to go, but it doesn't care *if* they get there safely. Today, I present ShareRide."

**(Problem)**: "We are solving the 'Latency of Safety.' Standard apps are reactive—ShareRide is proactive. It provides Virtual Companionship."

**(Features)**: "We use the Google Maps API and Firestore listeners to create the 'Shrinking Blue Line' navigation. If two friends want to meet the rider, the app renders green markers and reroutes the line automatically."

**(Technical)**: "Under the hood, we use Next.js 15 and Firebase Genkit. Gemini 2.5 Flash analyzes the route to suggest the safest meeting points based on proximity."

**(Closing)**: "ShareRide isn’t just an app; it’s a digital safety net. We are empowering our community to move freely and confidently. Thank you."

---
*Developed and Hosted by Sujal Bafna for MIT Art, Design & Technology University.*