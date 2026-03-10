import React, { useEffect, useState, useRef } from 'react';
import "./loginPage.css"
import { useNavigate } from "react-router-dom";
//import App from '../App';

const CreateLoginPage = () => {
    const [email, setEmail] = useState(""); //To capture email
    const [status, setStatus] = useState("")
    const navigate = useNavigate();

    const handleGetCode = async () => {
        try {
                if(email.includes("@bristol.ac.uk")){
       const message = 
  "SharedGo follows the University of Bristol’s Information Security Policy (ISP-07),University emails are prohibited for external services. Please use a personal email."
;
setStatus(message);
                    return
                }
            const response = await fetch("http://localhost:3000/api/auth/email/start", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            if (response.ok) {
                //Move to verify page and pass the email so we can use it there
                navigate("/verify", { state: { email } });
            } else {
                const data = await response.json().catch(() => ({}));
                setStatus(data.message || `Request failed (HTTP ${response.status}).`);
            }
        } catch (err) {
            console.error("Connection error:", err);
            setStatus("Cannot reach backend. Make sure it is running on http://localhost:3000/api.");
        }
    };
    return (
       <div className="authPage">
        <div className="authCard">
        <img src="/src/assets/Logo.png" alt="SharedGo Logo" className="AppTitle" />
                <div className="headerGroup">
                 <h2 className="createAccount">Create an account</h2>
                 <p className="helperText">Enter your email to sign up for this app</p>
                </div>
         <div className="inputGroup">
           <input 
             type="email" 
             placeholder="email@domain.com" 
             className="emailField"
             value={email}
             onChange={(e) => setEmail(e.target.value)}
           />
           <div className='wrong-code'>{status}</div>
           <button className="blackButton" onClick={handleGetCode}>Get verification code</button>
         </div>
        </div>
      </div>
    );
  };
  


export default CreateLoginPage
