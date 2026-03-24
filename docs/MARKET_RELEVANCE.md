# Market Relevance: ShareRide Safety Hub

This document analyzes the market relevance of ShareRide using the **Human-Centered Design (IDEO)** framework, focusing on the intersection of Desirability, Feasibility, and Viability.

---

## 1. Desirability (The Human Lens)
**"What do people desire?"**

*   **The Emotional Need**: Students and faculty at MIT ADT desire peace of mind. Solo travel between labs, libraries, and hostels—especially late at night—creates an "anxiety gap" that standard navigation tools don't address.
*   **The Solution**: ShareRide fulfills the desire for **Virtual Companionship**. It transforms a lonely walk into a monitored, shared experience.
*   **Privacy-First Design**: Users desire control. ShareRide only shares location during an active journey, ensuring safety without compromising personal privacy during downtime.
*   **Community Trust**: Unlike global social media, the platform is restricted to university members, fulfilling the human desire for a "closed-loop" secure environment.

---

## 2. Feasibility (The Technical Lens)
**"What is technically and organizationally feasible?"**

*   **Technical Scalability**: Built on a **Serverless Architecture** (Firebase + Next.js), the platform is highly feasible. It requires zero server maintenance and uses low-latency NoSQL databases for real-time GPS tracking.
*   **API Ecosystem**: Leveraging the **Google Maps JavaScript API** ensures that high-accuracy navigation and location services are already available and easy to integrate.
*   **Rapid Deployment**: Using Firebase Authentication and Cloud Firestore allows for a secure, functional MVP to be deployed within weeks rather than months.
*   **Operational Ease**: The app is accessible via any mobile browser, eliminating the technical friction of requiring users to download a native app from an App Store.

---

## 3. Viability (The Business Lens)
**"What can be financially viable?"**

*   **Low Operating Cost (OPEX)**: By utilizing the **Firebase Spark Tier**, the project can support up to 200-500 active users with **zero monthly infrastructure costs**. This makes it highly viable for a university-funded pilot.
*   **Institutional Value**: For MIT ADT University, the platform creates significant value by enhancing student safety, which is a key factor in institutional reputation and campus life quality.
*   **Sustainability Model**: 
    *   *Pilot Phase*: Free institutional service.
    *   *Scale Phase*: Low-cost subscription model for premium "Extended Network" features or institutional sponsorship.
*   **Resource Efficiency**: The serverless nature of the project means that costs only scale with actual usage (Blaze Plan), preventing wasted expenditure on idle resources.

---

## Conclusion
ShareRide sits at the **Innovation Sweet Spot**. It addresses a high-demand human need (Desirability), uses reliable and accessible technology (Feasibility), and operates with a highly efficient cost structure (Viability).

**Prepared for:** MIT ADT University Presentation  
**Project:** ShareRide Safety Platform  
**Developer:** Sujal Bafna  
**Framework:** IDEO Human-Centered Design Toolkit
