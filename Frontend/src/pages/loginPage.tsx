import React, { useEffect, useState, useRef } from 'react';
import "./loginPage.css"
import { useNavigate } from "react-router-dom";
//import App from '../App';

const CreateLoginPage = () => {
    const [email, setEmail] = useState(""); //To capture email
    const navigate = useNavigate();

    const handleGetCode = async () => {
        try {
            const response = await fetch("http://localhost:3000/auth/email/start", {
                method: "POST",
                headers: { "ContentType": "application/json" },
                body: JSON.stringify({ email }),
            });

            if (response.ok) {
                //Move to verify page and pass the email so we can use it there
                navigate("/verify", { state: { email } });
            } else {
                const data = await response.json();
                alert(data.message || "Something went wrong");
            }
        } catch (err) {
            console.error("Connection error:", err);
        }
    };
    return (
       <div className="loginPage">
        <div className="loginCard">
            <h1 className="AppTitle">SharedGo</h1>
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
           <button className="blackButton" onClick={handleGetCode}>Get verification code</button>
         </div>
        </div>
      </div>
    );
  };
  


export default CreateLoginPage