import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LoginPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const requiredDomain = '@cipsa.com.pe'; // Specific domain

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(''); // Clear previous messages

    if (!email.includes(requiredDomain)) {
      setMessage(`Error: El correo debe contener el dominio "${requiredDomain}"`);
      return;
    }

    // If email domain is valid, consider it a successful login
    setMessage('Login exitoso!');
    login(name, email); // Call login from AuthContext with name and email
    navigate('/home'); // Redirect to home/dashboard
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="flex justify-center mb-6">
          <img src="/favicon.png" alt="Logo" className="h-20 w-20" />
        </div>
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white">Gestion 360</h2>
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
              Nombre
            </label>
            <input
              type="text"
              id="name"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:text-white dark:border-gray-600"
              placeholder="Tu Nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
              Correo Electrónico
            </label>
            <input
              type="email"
              id="email"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:text-white dark:border-gray-600"
              placeholder="tu.correo@cipsa.com.pe"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline dark:bg-blue-600 dark:hover:bg-blue-700"
            >
              Ingresar
            </button>
          </div>
        </form>
        {message && (
          <p className={`mt-4 text-center ${message.startsWith('Error') ? 'text-red-500' : 'text-green-500'}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
