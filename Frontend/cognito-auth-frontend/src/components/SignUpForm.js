import React, { useState } from 'react';
import { CognitoUserPool } from 'amazon-cognito-identity-js';
import { config } from '../config';

const SignUpForm = () => {
  const [form, setForm] = useState({
    username: '',
    password: '',
    challengeQuestion: '',
    challengeAnswer: '',
    caesarKey: '',
  });
  const [message, setMessage] = useState('');

  const pool = new CognitoUserPool({
    UserPoolId: config.userPoolId,
    ClientId: config.clientId,
  });

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = e => {
    e.preventDefault();
    pool.signUp(
      form.username,
      form.password,
      [
        { Name: 'custom:challenge_question', Value: form.challengeQuestion },
        { Name: 'custom:challenge_answer', Value: form.challengeAnswer },
        { Name: 'custom:caesar_key', Value: form.caesarKey },
      ],
      null,
      (err, result) => {
        if (err) {
          setMessage(err.message);
        } else {
          setMessage('Sign up successful. Please proceed to sign in.');
        }
      }
    );
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Sign Up</h2>
      <input name="username" placeholder="Username" onChange={handleChange} required />
      <input type="password" name="password" placeholder="Password" onChange={handleChange} required />
      <input name="challengeQuestion" placeholder="Challenge Question" onChange={handleChange} required />
      <input name="challengeAnswer" placeholder="Answer" onChange={handleChange} required />
      <input name="caesarKey" placeholder="Caesar Cipher Key (e.g., 3)" onChange={handleChange} required />
      <button type="submit">Register</button>
      <p>{message}</p>
    </form>
  );
};

export default SignUpForm;
