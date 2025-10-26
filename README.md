#  Nexus Weather Analytics Dashboard 

###  Cold Start Notice

As the backend is hosted on Render's free tier, the server will "spin down" after inactivity to conserve resources.

For the **initial request**, please expect a **10–15 second delay** before the dashboard's data populates. Subsequent requests are fast.

##  Live Deployment and Access

| Platform | URL | Status |
| :--- | :--- | :--- |
| **Netlify** | https://dbms-weather-app.netlify.app/ | Live |

###  Cold Start Notice

As the backend is hosted on Render's free tier, the server will "spin down" after inactivity to conserve resources.

For the **initial request**, please expect a **10–15 second delay** before the dashboard's data populates. Subsequent requests are fast.

---

##  Project Stack and Architecture

The application uses a stable, three-tier architecture that meets the core project requirement of using a relational database.

| Component | Technology | Role |
| :--- | :--- | :--- |
| **Database (DBMS)** | MySQL (via Freesqldatabase.com) | Hosts the permanent relational database and executes all core SQL aggregation and retrieval queries. |
| **Backend API** | Node.js (Express) | Serves as the middle layer, validating data, securing the connection to the external MySQL database, and providing RESTful endpoints. |
| **Frontend UI** | HTML5, Tailwind CSS, JavaScript | Provides the dynamic, responsive dashboard UI, custom calendar modal, and asynchronous data fetching. |
| **Visualization** | Chart.js | Renders dynamic, metric-specific bar charts with calculated color-grading for comparative analysis. |
| **Deployment** | Render.com & Netlify | Render hosts the live API; Netlify hosts the static frontend. |

---

##  Key Areas of Achievement (DBMS Focus)

This project demonstrates proficiency in advanced SQL and database integrity management:

| Area | SQL Implementation | Project Significance |
| :--- | :--- | :--- |
| **Data Integrity** | Utilized Foreign Key constraint (city_id) and a compound UNIQUE constraint ((city_id, record_date)) directly on the MySQL tables. | Guarantees that data is relational and prevents duplicate data entry for the same city on the same day. |
| **Complex Aggregation** | Executes SELECT AVG(metric) AS average_value ... GROUP BY city_name queries dynamically within the API. | Fulfills the core requirement for data analysis by calculating averages across variable metrics (Temp, Humidity, Wind Speed). |
| **Transactional Logic** | The POST endpoint uses a database transaction (BEGIN TRANSACTION / COMMIT) to handle the conditional insertion of new cities and records efficiently. | Ensures data integrity and consistency during the critical data entry process. |
| **Deployment Success** | Successfully connected a Node.js server (hosted on Render) to an external public MySQL database (Freesqldatabase.com) across the internet. | Demonstrates mastery of three-tier architecture and network connectivity essentials. |

---

##  Group Contribution and Ownership

| Name | Roll Number | Key Areas of Contribution |
| :--- | :--- | :--- |
| Mainak Debnath | 18 | API Development (Node.js/Express), MySQL Schema Design, Data Validation. |
| Priyanshu Kumar | 19 | Frontend Structure (HTML/Tailwind), Data Entry Form Logic, Custom Calendar Implementation. |
| Ritam Saha | 72 | Chart Integration (Chart.js), Dynamic UI Rendering, Data Fetching & Visualization Logic. |
