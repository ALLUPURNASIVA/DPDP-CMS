import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSecureClient } from '../../api';
import { useAuth0 } from '@auth0/auth0-react';

export default function FiduciaryList() {
  const [companies, setCompanies] = useState([]);
  const [search, setSearch] = useState("");
  const [view, setView] = useState("all"); // 'all' or 'connected'
  const { getAccessTokenSilently } = useAuth0();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    const api = await getSecureClient(getAccessTokenSilently);
    // You will need to add this simple GET endpoint to your backend later
    const res = await api.get('/fiduciaries'); 
    setCompanies(res.data);
  };

  const filteredCompanies = companies.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Fiduciary Companies</h2>
        <div className="flex bg-gray-200 rounded p-1">
          <button className={`px-4 py-1 rounded ${view === 'all' ? 'bg-white shadow' : ''}`} onClick={() => setView('all')}>All</button>
          <button className={`px-4 py-1 rounded ${view === 'connected' ? 'bg-white shadow' : ''}`} onClick={() => setView('connected')}>Connected</button>
        </div>
      </div>
      
      <input 
        type="text" 
        placeholder="Search for a company..." 
        className="w-full p-3 border rounded-lg mb-6"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="grid md:grid-cols-2 gap-4">
        {filteredCompanies.map(c => (
          <div key={c.id} className="bg-white p-6 border rounded-lg shadow-sm flex justify-between items-center">
            <span className="font-semibold text-lg">{c.name}</span>
            <button 
              onClick={() => navigate(`/user/consent/${c.tenantId}`)}
              className="bg-blue-50 text-blue-600 px-4 py-2 rounded hover:bg-blue-100"
            >
              Manage Consents
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}