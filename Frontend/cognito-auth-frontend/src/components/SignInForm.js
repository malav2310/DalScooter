import React, { useState } from 'react';
import {
  CognitoUser,
  AuthenticationDetails,
} from 'amazon-cognito-identity-js';
import { config } from '../config';
import { CognitoUserPool } from 'amazon-cognito-identity-js';

const SignInForm = () => {
  const [form, setForm] = useState({ username: '', password: '', answer: '' });
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState('');
  const [user, setUser] = useState(null);
  const [challengePrompt, setChallengePrompt] = useState('');

  const pool = new CognitoUserPool({
    UserPoolId: config.userPoolId,
    ClientId: config.clientId,
  });

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const startAuth = () => {
    const userData = {
      Username: form.username,
      Pool: pool,
    };

    const cognitoUser = new CognitoUser(userData);
    setUser(cognitoUser);

    const authDetails = new AuthenticationDetails({
      Username: form.username,
      Password: form.password,
    });

    cognitoUser.initiateAuth(authDetails, {
      onSuccess: result => {
        setMessage('Authentication successful!');
      },
      onFailure: err => {
        setMessage(err.message);
      },
      customChallenge: challenge => {
        const params = challenge.getChallengeParam();
        setChallengePrompt(params.prompt || params.question || 'Answer the challenge');
        setStep(2);
      },
    });
  };

  const handleChallengeResponse = () => {
    user.sendCustomChallengeAnswer(form.answer, {
      onSuccess: result => setMessage('Authentication complete!'),
      onFailure: err => setMessage(err.message),
      customChallenge: challenge => {
        const params = challenge.getChallengeParam();
        setChallengePrompt(params.prompt || params.question || 'Answer the challenge');
      },
    });
  };

  return (
    <>
      <h2>Sign In</h2>
      {step === 1 && (
        <>
          <input name="username" placeholder="Username" onChange={handleChange} required />
          <br/>
          <input type="password" name="password" placeholder="Password" onChange={handleChange} required />
          <br/>
          <button onClick={startAuth}>Sign In</button>
        </>
      )}
      {step > 1 && (
        <>
          <p>{challengePrompt}</p>
          <input name="answer" placeholder="Answer" onChange={handleChange} required />
          <br/>
          <button onClick={handleChallengeResponse}>Submit</button>
        </>
      )}
      <p>{message}</p>
    </>
  );
};

export default SignInForm;
