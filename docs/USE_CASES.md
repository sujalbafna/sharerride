# ShareRide Use Case Documentation

This document outlines the primary use cases for the **ShareRide** application, focusing on student/faculty safety and community-based transit coordination.

## Actors
- **User (Student/Faculty):** The primary user who initiates journeys or manages their safety network.
- **Friend:** A verified contact within a User's circle who receives alerts and can join journeys.
- **System:** The Firebase backend and GenAI services that coordinate data, tracking, and messaging.

## Use Case Diagram (Mermaid)

```mermaid
useCaseDiagram
    actor "User (Student/Faculty)" as U
    actor "Friend" as F
    actor "System" as S

    package "Identity & Network" {
        usecase "UC1: Register/Login (Verified Role)" as UC1
        usecase "UC2: Manage Profile & SOS Contacts" as UC2
        usecase "UC3: Search & Connect with Friends" as UC3
    }

    package "Safe Transit" {
        usecase "UC4: Initialize & Broadcast Journey" as UC4
        usecase "UC5: Real-time Live Tracking" as UC5
        usecase "UC6: Request to Join Journey" as UC6
        usecase "UC7: Approve Journey Companions" as UC7
    }

    package "Safety & Communication" {
        usecase "UC8: Secure End-to-End Chat" as UC8
        usecase "UC9: Trigger SOS (System & SMS)" as UC9
        usecase "UC10: View Security Event Logs" as UC10
    }

    U --> UC1
    U --> UC2
    U --> UC3
    U --> UC4
    U --> UC9
    
    F --> UC3
    F --> UC6
    F --> UC8
    
    UC4 ..> S : Broadcasts Itinerary
    UC5 ..> S : Updates GPS
    UC9 ..> S : Alerts Network
    UC6 ..> UC7 : Notification
```

## Detailed Use Case Descriptions

### 1. Identity & Network Management
- **UC1: Register/Login:** Users sign up with specific roles (Student/Faculty).
- **UC2: Manage Profile:** Users update contact info, addresses, and configure up to 3 emergency SMS recipients.
- **UC3: Search & Connect:** Users search for others and verify their identity (Email, Phone, Address) before establishing a trusted link.

### 2. Safe Transit Workflow
- **UC4: Initialize Journey:** User inputs Origin, Destination, Route Via, and Vehicle details.
- **UC5: Broadcast Itinerary:** The system sends a detailed alert (including AC status and Full Name) to all friends in the circle.
- **UC6: Join Journey:** Friends can request to join an active transit as companions.
- **UC7: Approve Companions:** The creator accepts requests, redirecting them to a shared live tracking view.

### 3. Safety Protocols
- **UC8: Trigger SOS:** 
    - *System Alert:* Notifies all friends immediately via the dashboard.
    - *SMS Alert:* Long-pressing (3s) the SOS button generates an AI-composed emergency message with a Google Maps link sent to pre-configured mobile numbers.
- **UC9: Secure Chat:** Real-time, encrypted messaging between connected friends for coordination.
- **UC10: Event Logs:** A history of all alerts and safety events for compliance and security review.
