import { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { getSecureClient } from '../../../api';
import { toast } from 'react-hot-toast';

// This tab lives inside FiduciaryDashboard
// Fiduciary Admin enters a user's email and assigns them as Worker
// Worker automatically gets the same tenantId as the Fiduciary Admin

export default function WorkerAccess() {
  const { getAccessTokenSilently } = useAuth0();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAssign = async () => {
    if (!email.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    setLoading(true);
    try {
      const api = await getSecureClient(getAccessTokenSilently);

      // Backend automatically uses the fiduciary admin's own tenantId
      await api.put('/users/fiduciary/assign-worker', { email });

      toast.success(`${email} has been assigned as a Worker`);
      setEmail('');

    } catch (error) {
      if (error.response?.status === 404) {
        toast.error('User not found. They must log in to the portal at least once first.');
      } else if (error.response?.status === 403) {
        toast.error('You do not have permission to assign workers.');
      } else {
        toast.error('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 bg-white p-8 rounded-xl shadow border">
      <h2 className="text-2xl font-bold mb-2">Worker Access</h2>
      <p className="text-gray-500 mb-6 text-sm">
        Assign a registered user as a Fiduciary Worker for your company.
        They must have logged in to the portal at least once before you can assign them.
      </p>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          User Email Address
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="worker@example.com"
          className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <button
        onClick={handleAssign}
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Assigning...' : 'Assign as Worker'}
      </button>
    </div>
  );
}