import React, { useEffect, useState, useRef } from 'react';
import "./loginPage.css" //Same css file for consistency
import { useLocation, useNavigate } from "react-router-dom";
//import App from '../App';

const CreateVerifyPage = () => {
     const location = useLocation();
     const navigate = useNavigate();
    
     //Get email from the navigation state sent by LoginPage
     const email = location.state?.email || "";
     const [code, setCode] = useState(new Array(6).fill("")) //Array for verification code
     const [status, setStatus] = useState("")
     const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

     const handleCodeChange = (target: HTMLInputElement, index: number) => {
         const val = target.value;
         if (isNaN(Number(val))) return; //Only allow numbers
      
         const newCode = [...code];
         //Take only the last character typed
         newCode[index] = val.substring(val.length - 1); 
         setCode(newCode); //makes the number appear in the box
      
         //Move to next box if value is entered
         if (val && index < 5) {
           inputRefs.current[index + 1]?.focus();
         }
       };
    
    //Allow backspace to previous box
     const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
         if (e.key === "Backspace" && !code[index] && index > 0) {
           inputRefs.current[index - 1]?.focus();
         }
       };

    //Handle submit (POST)
    const handleSubmit = async () => {
        const fullCode = code.join(""); //Merges 6 digit code into a single string
        setStatus("Verifying");
        try {
            const response = await fetch("http://localhost:3000/auth/email/verify", { 
                method: "POST", //Send data to auth/email/verify endpoint
                headers: { "Content-Type": "application/json" },
                credentials: "include", //Required to save session cookie, keeps user logged in
                body: JSON.stringify({ email, code: fullCode }),//JSON format backend can read
            });

            const data = await response.json();

            if (response.ok) {
                navigate("/home"); //Redirect to home page on success
            } else {
                setStatus(data.message || "Invalid code.");
            }
        } catch (err) {
            setStatus("Error connecting to server.");
        }
    };

    return (
       <div className="authPage"> 
        <div className='authCard'> {/*Same name for consistency*/}
            <h1 className="AppTitle">SharedGo</h1>
                <div className="headerGroup">
                    <h2 className="createAccount">Enter verification code</h2>
                    <p className="helperText">A 6-digit code was sent to <b>{email}</b></p>
                </div>
            <div className='verifyBox'>
            {code.map((digit, index) => (
                <input
                key={index}
                type="text"
                maxLength={1}
                className="verificationInput"
                value={digit}
                ref={(el) => { inputRefs.current[index] = el; }}
                onChange={(e) => handleCodeChange(e.target, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                />
            ))}
            </div>
            <button className="blackButton submitBtn" onClick={handleSubmit}>Submit</button>
        </div> 
      </div>
    );
  };

export default CreateVerifyPage