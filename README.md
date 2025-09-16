# _Hackceler8
QuantumOTP is a developer-friendly API that delivers secure one-time passwords (OTPs) using quantum random number generation with Qiskit. Developers can sign up to get an API key and integrate our /generate-otp endpoint into their apps, saving time while ensuring truly unpredictable and reliable OTP-based authentication.

# **Quantum-Powered Authentication Service**

## **📖 Overview**

This project is a full-stack, secure authentication service that leverages the principles of quantum mechanics to generate truly random One-Time Passwords (OTPs) and API keys. By using the Qiskit framework to simulate a quantum computer, we can generate random numbers based on the measurement of qubits in superposition, offering a higher level of unpredictability compared to classical pseudo-random algorithms.

The service provides a complete ecosystem including:

* A RESTful API for developers to integrate quantum-secure OTPs into their applications.  
* A developer portal with documentation and an API key generation system.  
* A functional frontend demonstration of the end-user authentication flow.

## **✨ Features**

* **Quantum Randomness**: Utilizes Qiskit to simulate quantum circuits for generating unpredictable random numbers for OTPs and API keys.  
* **RESTful API**: Simple endpoints for requesting and verifying OTPs.  
* **Developer Portal**: A landing page (land.html) with API documentation and a self-service signup form to generate API keys.  
* **Secure Backend**: Built with Python and Flask, storing hashed OTPs and API keys in a PostgreSQL database.  
* **Email Delivery**: Delivers OTPs and API keys securely to users via email.  
* **Demonstration UI**: A clean, responsive frontend (index.html) built with Tailwind CSS to showcase the end-user login experience.

## **🛠️ Technology Stack**

* **Backend**: Python, Flask, Qiskit, PostgreSQL  
* **Frontend**: HTML, Tailwind CSS, Vanilla JavaScript  
* **Python Libraries**: psycopg2-binary, python-dotenv, qiskit, qiskit-aer, Flask-Cors

## **flowchart**

graph TD  
    subgraph Developer Onboarding  
        A\[Developer visits Landing Page\] \--\> B{Enters Email & Company};  
        B \--\> C\[API Key Backend\];  
        C \-- Generates Quantum API Key \--\> D\[PostgreSQL Database\];  
        C \-- Sends Key via Email \--\> E\[Developer's Inbox\];  
    end

    subgraph End-User Authentication Flow  
        F\[User visits Client App\] \--\> G{Enters Email};  
        G \-- POST /request-otp \--\> H\[OTP Service Backend\];  
        H \-- Generates Quantum OTP \--\> I\[Hashes & Stores OTP in DB\];  
        H \-- Sends OTP via Email \--\> J\[User's Inbox\];  
        J \--\> K{User Enters OTP in App};  
        K \-- POST /verify-otp \--\> H;  
        H \-- Verifies against DB Hash \--\> L\[Login Success\!\];  
    end

    style C fill:\#2da44e,stroke:\#fff,stroke-width:2px  
    style H fill:\#2da44e,stroke:\#fff,stroke-width:2px  
    style D fill:\#db6d28,stroke:\#fff,stroke-width:2px  
    style I fill:\#db6d28,stroke:\#fff,stroke-width:2px

## **🚀 Getting Started**

Follow these instructions to get the project up and running on your local machine.

### **1\. Prerequisites**

* Python 3.9+  
* PostgreSQL database server  
* A Google Mail account with an **App Password** enabled for sending emails. (Learn how to create one [here](https://support.google.com/accounts/answer/185833)).

### **2\. Installation & Setup**

**A. Clone the Repository**

git clone \[https://github.com/your-username/quantum-auth-service.git\](https://github.com/your-username/quantum-auth-service.git)  
cd quantum-auth-service

B. Set up Python Environment & Dependencies  
Create and activate a virtual environment:  
python \-m venv venv  
source venv/bin/activate  \# On Windows, use \`venv\\Scripts\\activate\`

Create a requirements.txt file with the following content:

Flask  
qiskit  
qiskit-aer  
psycopg2-binary  
python-dotenv  
Flask-Cors

Install the dependencies:

pip install \-r requirements.txt

**C. Configure PostgreSQL Database**

1. Connect to your PostgreSQL server and create a new database and user.  
2. Execute the following SQL commands to create the necessary tables:

\-- Table to store the API keys for client applications  
CREATE TABLE api\_keys (  
    id SERIAL PRIMARY KEY,  
    email VARCHAR(255) UNIQUE NOT NULL,  
    api\_key VARCHAR(255) UNIQUE NOT NULL,  
    company\_name VARCHAR(255),  
    created\_by VARCHAR(100),  
    created\_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT\_TIMESTAMP  
);

\-- Table to store active (unverified) OTPs  
CREATE TABLE active\_otps (  
    id SERIAL PRIMARY KEY,  
    user\_email VARCHAR(255) NOT NULL,  
    otp\_hash VARCHAR(256) NOT NULL,  
    created\_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT\_TIMESTAMP,  
    expires\_at TIMESTAMP WITH TIME ZONE NOT NULL  
);

D. Set up Environment Variables  
Create a file named .env in the root of the project directory and add the following variables. Do not commit this file to version control.  
\# Your PostgreSQL connection string  
DATABASE\_URL="postgresql://user:password@host:port/database\_name"

\# Your Gmail address and App Password  
EMAIL\_ADDRESS="your-email@gmail.com"  
EMAIL\_PASSWORD="your-16-character-app-password"

\# The URL where the frontend is served (for CORS)  
FRONTEND\_URL="\[http://127.0.0.1:5500\](http://127.0.0.1:5500)" \# Example for VS Code Live Server

### **3\. Running the Application**

This project has two separate backend services that need to run concurrently.

A. Run the API Key Generation Service  
This service handles developer signups from land.html.  
\# This backend provides the API key to developers  
flask run \--port 5000 \--app api\_gen\_back.py

B. Run the OTP Authentication Service  
This service handles the end-user login flow from index.html.  
\# This backend handles OTP requests and verification  
flask run \--port 5001 \--app chatapp.py

C. Launch the Frontend  
Open the land.html and index.html files in your web browser. A simple way to do this is with a live server extension in your code editor (like "Live Server" in VS Code), which also handles CORS correctly.

1. **Get your API key:** Open land.html, fill out the signup form. You will receive an API key in your email.  
2. **Test the login:** Open index.html, enter your email to receive a quantum OTP, and use it to log in.

## **📂 Project Structure**

.  
├── land.html               \# Developer landing page, documentation, and API key signup  
├── index.html              \# End-user authentication demo page  
├── auth\_ui.js              \# JavaScript for the end-user demo (index.html)  
│  
├── chatapp.py              \# Main Flask App: OTP request and verification API  
├── api\_gen\_back.py         \# Secondary Flask App: API key generation for developers  
│  
├── quantum\_otp\_generator.py \# Core logic for generating quantum-random OTPs  
├── api\_gen.py              \# Core logic for generating quantum-random API keys  
│  
└── .env                    \# (To be created) Environment variables  
└── requirements.txt        \# (To be created) Python dependencies

## **📜 License**

This project is licensed under the MIT License. See the LICENSE file for details.
