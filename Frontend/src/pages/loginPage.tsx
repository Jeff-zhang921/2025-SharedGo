//import React, { useEffect, useState } from 'react';
import "./loginPage.css"
//import { Link } from "react-router-dom";
//import App from '../App';

const CreateLoginPage = () => {
    return (
      <div className="loginPage">
        <div className="loginCard">
            <h1 className="AppTitle">SharedGo</h1>
             <h2 className="createAccount">Create an account</h2>
              <p className="helperText">Enter your email to sign up for this app</p>
        </div>
        <div className="inputGroup">
          <input 
            type="email" 
            placeholder="email@domain.com" 
            className="emailField"
          />
          <button className="black-button">Get verification code</button>
        </div>
      </div>
    );
  };
  


export default CreateLoginPage