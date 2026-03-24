# Technical Documentation: ShareRide Safety Platform

## 1. Project Overview
ShareRide is a mobile-first web application designed to enhance the safety of university students and faculty during transit. It leverages real-time GPS tracking, a "Trusted Circle" social network, and Generative AI to provide proactive security monitoring and emergency response.

---

## 2. Technology Stack
- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS.
- **UI Components**: Shadcn UI, Lucide Icons.
- **Backend-as-a-Service**: Google Firebase.
  - **Authentication**: Firebase Auth (Email/Password & Phone OTP Link).
  - **Database**: Cloud Firestore (NoSQL Real-time Database).
  - **Hosting**: Firebase App Hosting.
- **AI Integration**: Firebase Genkit with Google Gemini 2.5 Flash.
- **Maps API**: Google Maps JavaScript API (Directions, Places, Geometry).

---

## 3. System Architecture
The application follows a **Serverless Architecture**, ensuring high availability and zero maintenance costs for the university.

### 3.1. Frontend Architecture
- **Client-Side Rendering (CSR)**: Used for all interactive map components and real-time listeners.
- **Server Actions**: Utilized for AI flow execution to keep API keys secure.
- **Responsive Design**: Mobile-first approach using Tailwind's grid and flexbox systems.

### 3.2. Real-time Synchronization
The app uses Firestore `onSnapshot` listeners to provide:
- Live location updates of friends during transit.
- Instant chat messaging.
- Real-time notifications for journey joins and emergency alerts.

---

## 4. Database Schema (Firestore)
The database is structured to balance read efficiency with security privacy.

- `/users/{userId}`: Private user profile, contact info, and emergency settings.
- `/publicProfiles/{userId}`: Searchable subset of data (Name, Role) for the "Find Friends" feature.
- `/users/{userId}/trustedContacts/{contactId}`: Represents the bidirectional trust link between users.
- `/users/{userId}/journeys/{journeyId}`: Specific travel records containing start/end coordinates and live GPS pings.
- `/users/{userId}/supportRequests/{requestId}`: Notifications for connections, ride requests, and alerts.

---

## 5. Security Implementation
### 5.1. Firebase Security Rules
Data access is strictly governed by attribute-based access control (ABAC):
- Users can only read/write their own private profile.
- Journey data is only visible to the rider and those explicitly added to their "Trusted Circle."
- Public profiles are read-only for authenticated university members.

### 5.2. 3-Way Verification
For extended network assistance (finding a friend's friend), the system implements a unique 3-way OTP protocol to ensure the identity of the assistant is validated by both the rider and a mutual contact.

---

## 6. Artificial Intelligence (Genkit)
The app integrates Generative AI via **Firebase Genkit** to handle complex logic:
- **Meeting Point Generator**: Analyzes route coordinates and friend proximity to suggest optimal safety checkpoints.
- **Emergency Message Composer**: Drafts high-urgency, location-aware SMS templates for immediate dispatch during SOS events.

---

## 7. API Integration (Google Maps)
- **Directions API**: Calculates route polylines and estimated time of arrival (ETA).
- **Places Autocomplete**: Ensures precise location entry for origins and destinations.
- **Geometry Library**: Used for proximity calculations between riders and potential companions.

---

## 8. Deployment & Scalability
The project is hosted on Google's global infrastructure. 
- **Scalability**: Capable of handling 50,000+ monthly active users without infrastructure adjustments.
- **Performance**: Edge-cached assets ensure sub-200ms latency for users within the campus region.

---
**Lead Developer:** Sujal Bafna  
**Institution:** MIT Art, Design & Technology University  
**Date:** February 2025
