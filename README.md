# UPang Assist - Dual Localhost Architecture

This project is configured with independent localhost ports for the **Student Assistant** and the **Admin Management Portal**.

## Localhost Port Topology

| Application | Directory | Localhost URL | Description |
| :--- | :--- | :--- | :--- |
| **Student Chatbot** | `my-react-app` | [http://localhost:5173](http://localhost:5173) | Interactive campus AI assistant for students & faculty |
| **Admin Portal** | `next-app` | [http://localhost:5174](http://localhost:5174) | Administrative dashboard to manage FAQs, inquiries & alerts |
| **Backend API** | `server` | [http://localhost:3000](http://localhost:3000) | Node.js Express server & MongoDB API |

---

## Quick Start Commands

From the root project directory:

```bash
# Start the Admin Portal (runs on http://localhost:5174)
npm run dev:admin

# Start the Student Chatbot (runs on http://localhost:5173)
npm run dev:student

# Start the Backend Server (runs on http://localhost:3000)
npm run dev:server
```

Or run them individually inside each folder:

```bash
# Admin Portal
cd next-app
npm run dev

# Student App
cd my-react-app
npm run dev
```

---

## Admin Portal Features (`http://localhost:5174`)

- **Secure Admin Authentication**: Pre-configured demo login (`admin@up.phinmaed.com` / `admin123`) and 1-Click login.
- **Dashboard Overview**: KPI cards for total inquiries, 94.6% resolution rate, response latency, and interactive inquiry traffic charts.
- **Knowledge Base (FAQ) Management**: Add, update, and manage official responses for:
  - Office of the University Registrar (TOR, Good Moral, CAV)
  - University Cashier & Tuition Installments
  - Hawak Kamay (HK) Scholarship Application & Renewal
  - Campus Landmark & Building Directory (CEA, CBT, Library, Pavilion)
  - Step-by-Step Enrollment & Curriculum Advising
  - University Clinic & Student Health Services
- **Student Inquiry Logs**: Inspect real chat transcripts, star ratings, and escalate queries to human offices.
- **Campus Broadcasts**: Create and broadcast urgent, warning, or informational alerts to students.
- **User Accounts & Roles**: Super Admin, Faculty, Staff, and Student directory with role modification.
- **System & AI Settings**: Configure assistant persona, office escalation emails, port bindings, and JSON backup export.
- **Cross-Port Navigation**: One-click jump between `localhost:5174` and `localhost:5173`.
