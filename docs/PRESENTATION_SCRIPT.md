# ShareRide: Presentation Script & Dialogue

**Project Title**: ShareRide – Your Social Safety Companion  
**Presenter**: Sujal Bafna  
**Target Audience**: Creiya Team / Evaluators

---

## 1. The Opening (The "Hook")
*(Start with a relatable scenario)*

"Good morning, Team Creiya. Imagine it’s 11:30 PM on the MIT ADT campus. A student is walking back from the library to their hostel. They’re using Google Maps for directions, but Google Maps only tells them *where* to go—it doesn't care *if* they get there safely. 

There is a massive 'Anxiety Gap' in current navigation technology. Today, I am proud to present **ShareRide**, a platform designed not just for navigation, but for community-driven security."

---

## 2. The Problem Statement
"University students and faculty often face heightened security risks during solo late-night transits. Standard SOS apps are reactive—they only work *after* something goes wrong. ShareRide is proactive. It builds a 'Social Safety Mesh' that monitors you before an incident occurs."

---

## 3. Core Feature Walkthrough (The "Show & Tell")

### A. The Trusted Circle
"Our app starts with the **Trusted Circle**. Users don't share their location with the world—only with verified friends. Using Firebase Authentication and Firestore, we’ve built a private social graph where every connection is a mutual handshake of trust."

### B. Live Journey Tracking (The "Shrinking Blue Line")
"When a user starts a journey, we leverage the **Google Maps JavaScript API** combined with **Real-time Firestore listeners**. As the rider moves, their GPS coordinates are synced instantly. You’ll notice the blue navigation line actually **shrinks** as they progress, giving their friends a precise, professional tracking experience similar to top-tier ride-sharing apps."

### C. Individual Meeting Points
"ShareRide supports **Virtual Companionship**. If two friends want to meet the rider along the way, they can set individual meeting points. The app renders unique green markers for each stop and intelligently reroutes the 'blue line' to pass through every rendezvous point."

### D. Zero-Latency SOS
"In a crisis, every second counts. We’ve implemented a **Quick SOS protocol**. A simple tap notifies the network via the app, but a **3-second hold** triggers a system-level SMS dispatch. This ensures coordinates reach guardians even in areas with poor data connectivity."

---

## 4. Technical Excellence (The "How")
"Technically, ShareRide is a masterpiece of modern serverless architecture:
- **Frontend**: Next.js 15 for lightning-fast performance.
- **Backend**: Firebase (Firestore, Auth, and Storage) for sub-200ms data synchronization.
- **AI Integration**: We use **Firebase Genkit with Gemini 2.5 Flash** to analyze routes and suggest the safest meeting points based on proximity and lighting.
- **Verification**: For extended network assistance, we've designed a **3-Way OTP Verification protocol** to cryptographically ensure the identity of anyone offering help."

---

## 5. The Closing (The "Vision")
"ShareRide isn’t just an app; it’s a digital safety net. By transforming a solo walk into a shared, monitored experience, we are empowering the MIT ADT community to move freely and confidently.

Thank you for your time. I’m now open to any technical or functional questions you may have."

---

## Quick Tips for your Presentation:
1. **The Demo**: If possible, show the "Recentre" button and the "Shrinking Blue Line" live. It’s the most visually impressive part of the app.
2. **The Impact**: Emphasize that this is built *specifically* for the university context, which makes it more feasible than a global tracking app.
3. **The AI**: Mention that Genkit helps calculate "Safety Scores" for meeting points—teams love hearing about Generative AI integration!
