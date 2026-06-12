import React from 'react';
import { useAuth0 } from "@auth0/auth0-react";

export const LoginButton = () => {
  const { loginWithRedirect } = useAuth0();
  return (
    <button 
      onClick={() => loginWithRedirect()} 
      className="bg-blue-600 text-white px-8 py-3 rounded-lg shadow hover:bg-blue-700 transition font-semibold"
    >
      Log In to Manage Data
    </button>
  );
};

export const LogoutButton = () => {
  const { logout } = useAuth0();
  return (
    <button 
      onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })} 
      className="text-gray-500 hover:text-gray-900 font-medium transition"
    >
      Log Out
    </button>
  );
};