import React, { useEffect, useState, useRef } from 'react';
import "./verifyPage.css"
//import { Link } from "react-router-dom";
//import App from '../App';

const CreateVerifyPage = () => {
     const [code, setCode] = useState(new Array(6).fill("")) //Array for verification code
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

    return (
       <div className="verifyPage">
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
        <button className="blackButton submitBtn">Submit</button>
      </div>
    );
  };

export default CreateVerifyPage