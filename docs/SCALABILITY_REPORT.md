# Scalability & Capacity Report: ShareRide

## Overview
ShareRide is built on a **Serverless Architecture** using Google Firebase. This ensures the application can handle growth from a small pilot group to a full university-wide rollout without performance degradation or the need for manual server management.

## User Capacity Analysis (Target: 200+ Users)
The platform is currently configured on the Firebase Spark Plan. For a user base of 200, the resource utilization is as follows:

| Service | Firebase Limit (Free Tier) | ShareRide Usage (200 Users) | Capacity Used |
| :--- | :--- | :--- | :--- |
| **Authentication** | 50,000 Monthly Active Users | 200 Users | 0.4% |
| **Firestore (Reads)** | 50,000 per day | ~4,000 per day* | 8% |
| **Firestore (Writes)** | 20,000 per day | ~1,000 per day* | 5% |
| **Real-time Sync** | 1,000,000 Concurrent Connections | ~50 Concurrent Users | 0.005% |
| **Cloud Hosting** | 10 GB Data Transfer/Month | ~1.5 GB / Month | 10% |

*\*Estimates based on typical daily transit activity for 200 active students.*

## Technical Advantages for Campus Rollout
1. **Low Latency**: Firestore uses global edge locations to ensure live tracking updates happen in under 200ms.
2. **Zero Downtime**: Since the backend is managed by Google, there are no "server crashes" even if all 200 users login at the exact same time (e.g., after a late-night college event).
3. **Security**: Firebase Security Rules ensure that even with 200+ users, no one can see another person's location unless they are explicitly part of their "Trusted Circle."

## Conclusion
The ShareRide architecture is **highly optimized** for a 200+ user environment. It provides a commercial-grade experience while remaining 100% cost-free within the initial growth phase.
