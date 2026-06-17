import React, { useState } from 'react';
import { useAuth0 } from "@auth0/auth0-react";
import toast from 'react-hot-toast';
import { getSecureClient } from '../../api'; // Adjust path if needed

export default function AccountSettings() {
  const { user, getAccessTokenSilently, logout } = useAuth0();
  const [confirmationText, setConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleRightToBeForgotten = async () => {
    if (confirmationText !== 'DELETE') return;
    
    setIsDeleting(true);
    try {
      const api = await getSecureClient(getAccessTokenSilently);
      
      // Trigger the massive backend transaction
      await api.delete('/user/forget-me', {
        headers: { 
          'X-User-Id': user.sub,
          'X-User-Email': user.email 
        }
      });

      toast.success("Your digital footprint has been eradicated.");
      
      // Log the user out of Auth0 immediately after wiping their data
      setTimeout(() => {
        logout({ logoutParams: { returnTo: window.location.origin } });
      }, 2000);

    } catch (e) {
      toast.error("Failed to process erasure request.");
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-10">
      <h2 className="text-3xl font-bold text-gray-800 mb-8">Account Privacy Settings</h2>

      {/* Standard Settings info could go here */}

      {/* DANGER ZONE */}
      <div className="mt-12 bg-white rounded-xl shadow-sm border-2 border-red-200 overflow-hidden">
        <div className="bg-red-50 border-b border-red-200 px-6 py-4">
          <h3 className="text-xl font-bold text-red-800 flex items-center gap-2">
            <span>⚠️</span> Danger Zone: Right to be Forgotten
          </h3>
        </div>
        
        <div className="p-6">
          <p className="text-gray-700 font-medium mb-2">
            Permanently delete your account and all associated data.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Under DPDP and GDPR regulations, you have the right to request the complete erasure of your digital footprint from our servers. 
            This action will trigger an irreversible database transaction that deletes your active consents, wipes your notification history, and permanently anonymizes your audit logs.
          </p>

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6">
            <label className="block text-sm font-bold text-slate-700 mb-2">
              To proceed, please type <span className="text-red-600 font-mono bg-red-50 px-1 rounded">DELETE</span> below:
            </label>
            <input 
              type="text" 
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder="DELETE"
              className="w-full max-w-xs p-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:outline-none uppercase font-mono"
            />
          </div>

          <button 
            onClick={handleRightToBeForgotten}
            disabled={confirmationText !== 'DELETE' || isDeleting}
            className={`px-6 py-3 rounded-lg font-bold text-white transition shadow-sm ${
              confirmationText === 'DELETE' && !isDeleting
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-red-300 cursor-not-allowed'
            }`}
          >
            {isDeleting ? 'Eradicating Data...' : 'Permanently Delete My Data'}
          </button>
        </div>
      </div>
    </div>
  );
}