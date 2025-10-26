# dbms-weather-analysis
# Nexus Weather Analytics Dashboard

###  Cold Start Notice
As we are using a free tier database hosting platform
For the **first load**, the server must "wake up." Please wait 10–15 seconds for the charts and data history to populate. Subsequent requests are fast.

###  Project Stack and Architecture

| Component | Technology | Role |
| :--- | :--- | :--- |
| Database | MySQL | Data storage and execution of aggregation queries. |
| Backend API | Node.js (Express) | Handles API requests (`/data`, `/history`, `/analysis`), connects to MySQL, and processes server-side logic. |
| Frontend UI | HTML5, JavaScript, Tailwind CSS | Provides the user interface for data entry, display, and visualization. |
| Visualization | Chart.js | Renders dynamic, metric-specific bar charts for comparative analysis. |
| Deployment | Render.com | Hosts the backend API for public accessibility. |

***

###  Group Contribution and Ownership

This assignment was a collaborative effort by the following team members:

| Name | Roll Number | Key Areas of Contribution |
| :--- | :--- | :--- |
| Mainak Debnath | 18 | API Development (Node.js/Express), MySQL Schema Design, Data Validation. |
| Priyanshu Kumar | 19 | Frontend Structure (HTML/Tailwind), Data Entry Form Logic, Custom Calendar Implementation. |
| Ritam Saha | 72 | Chart Integration (Chart.js), Dynamic UI Rendering, Data Fetching & Visualization Logic. |

***

###  How the Project Was Made (Development Process)

We followed a three-step development process focused on separation of concerns:

1.  Database Layer (DBMS Core):
    * Designed a relational schema in **MySQL** to efficiently store weather records (`city_name`, `record_date`, `temperature`, `humidity`, `wind_speed`).
    * The database is accessed via the Node.js API to perform **CRUD** operations (Create for new data entry) and execute complex **aggregate queries** for the analytical charts (e.g., calculating the average metric per city).

2.  API Layer (The Bridge):
    * We built a RESTful API using **Node.js/Express**.
    * Three key endpoints were created to serve the frontend:
        * `/api/data` (`POST`): Inserts new weather records into the MySQL database.
        * `/api/history` (`GET`): Fetches the recent raw data for the history list.
        * `/api/analysis` (`GET`): Fetches aggregated data (e.g., average metric per city) to power the charts.

3.  Frontend Layer (User Experience):
    * The UI was styled using **Tailwind CSS** for a dark, data-centric aesthetic.
    * JavaScript logic handles user interactions (form submission, date selection, metric change).
    * The dashboard dynamically re-fetches and updates both the **data metrics** and the **visualizations** upon any new data entry, showcasing effective real-time data flow from the database.

***

