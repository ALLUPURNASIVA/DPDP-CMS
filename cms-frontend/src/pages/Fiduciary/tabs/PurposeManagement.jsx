import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import toast from 'react-hot-toast';
import { getSecureClient } from '../../../api'; 

export default function PurposeManagement() {
  const { getAccessTokenSilently } = useAuth0();
  
  // State specific to THIS component
  const [purposes, setPurposes] = useState([]);
  const [editingPurpose, setEditingPurpose] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [retention, setRetention] = useState(6);
  const [isMandatory, setIsMandatory] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchMyPurposes();
  }, []);

  const fetchMyPurposes = async () => {
    setIsLoading(true);
    try {
      const api = await getSecureClient(getAccessTokenSilently);
      const res = await api.get('/fiduciary/purposes'); 
      setPurposes(res.data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load company purposes.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePurpose = async () => {
    if (!newName.trim() || !newDesc.trim()) {
      toast.error("Please fill in both the name and description.");
      return;
    }

    setIsCreating(true);
    try {
      const api = await getSecureClient(getAccessTokenSilently);
      const payload = {
        name: newName,
        description: newDesc,
        retentionPeriodMonths: retention,
        mandatory: isMandatory
      };

      if (editingPurpose) {
        // UPDATE MODE
        await api.put(`/fiduciary/purposes/${editingPurpose.id}`, payload);
        toast.success("Purpose updated successfully!");
      } else {
        // CREATE MODE
        await api.post('/fiduciary/purposes', payload);
        toast.success("Purpose created successfully!");
      }
      
      // Reset everything
      setNewName(""); setNewDesc(""); setRetention(6); setIsMandatory(false);
      setEditingPurpose(null);
      fetchMyPurposes();
    } catch (error) {
      toast.error("Action failed.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleEdit = (purpose) => {
        setEditingPurpose(purpose);
        setNewName(purpose.name);
        setNewDesc(purpose.description);
        setRetention(purpose.retentionPeriodMonths);
        setIsMandatory(purpose.mandatory);
  };

  const updatePurpose = async (id, updatedPurpose) => {
    try {
      const api = await getSecureClient(getAccessTokenSilently);
      await api.put(`/fiduciary/purposes/${id}`, updatedPurpose);
      toast.success("Purpose updated!");
      fetchMyPurposes();
    } catch (error) {
      toast.error("Failed to update purpose.");
    }
  };

  const handleRetire = async (id) => {
    if (!confirm("Are you sure you want to retire this purpose?")) return;
    
    try {
      const api = await getSecureClient(getAccessTokenSilently);
      await api.put(`/fiduciary/purposes/${id}/retire`);
      toast.success("Purpose retired successfully.");
      fetchMyPurposes();
    } catch (error) {
      toast.error("Failed to retire purpose.");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
      <h2 className="text-xl font-bold mb-2 text-gray-900">Custom Purpose Management</h2>
      <p className="text-gray-500 text-sm mb-8">Create and modify data processing categories specific to your company.</p>
      
      <div className="grid md:grid-cols-3 gap-10">
        {/* ADD PURPOSE FORM */}
        <div className="md:col-span-1 border-r border-gray-100 pr-8">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-5">
            {editingPurpose ? "Edit Purpose" : "Add New Purpose"}
          </h3>
          <div className="space-y-5">
            <input type="text" placeholder="Name (e.g. AI Training)" value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition" />
            <textarea placeholder="Description..." value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition h-28 resize-none"></textarea>
            
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-2">Data Retention Period</label>
              <select value={retention} onChange={(e) => setRetention(Number(e.target.value))} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition bg-white">
                <option value={3}>3 Months</option>
                <option value={6}>6 Months (Standard)</option>
                <option value={12}>12 Months</option>
                <option value={24}>24 Months</option>
              </select>
            </div>

            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" checked={isMandatory} onChange={(e) => setIsMandatory(e.target.checked)} className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
              <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition">Mandatory Purpose</span>
            </label>

            <button 
                onClick={handleCreatePurpose}
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm">
                {editingPurpose ? "Save Changes" : "Create Purpose"}
            </button>
            {editingPurpose && (
                <button 
                    onClick={() => { setEditingPurpose(null); setNewName(""); setNewDesc(""); }}
                    className="w-full mt-2 text-gray-500 text-sm hover:underline"
                >
                    Cancel Edit
                </button>
            )}
          </div>
        </div>

        {/* ACTIVE PURPOSES LIST */}
        <div className="md:col-span-2">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-5">
            Purposes Overview
        </h3>

        {/* ... (isLoading and length checks remain the same) ... */}

        <div className="space-y-4">
            {/* SORTING LOGIC: Moves active items to the top */}
            {[...purposes].sort((a, b) => b.isActive - a.isActive).map((purpose) => (
            <div 
                key={purpose.id} 
                className={`p-5 border border-gray-200 rounded-xl flex justify-between items-start transition 
                ${purpose.isActive === false ? 'bg-gray-50 opacity-60 grayscale' : 'bg-white hover:shadow-sm'}`}
            >
                <div>
                <div className="flex items-center gap-3">
                    <h4 className={`font-bold ${purpose.isActive === false ? 'text-gray-500' : 'text-gray-900'}`}>
                    {purpose.name}
                    </h4>
                    {purpose.isMandatory && (
                    <span className="px-2.5 py-0.5 bg-gray-200 text-gray-600 text-[10px] font-bold tracking-wider rounded-full">
                        MANDATORY
                    </span>
                    )}
                    {purpose.isActive === false && (
                    <span className="px-2.5 py-0.5 bg-gray-200 text-gray-500 text-[10px] font-bold tracking-wider rounded-full">
                        RETIRED
                    </span>
                    )}
                </div>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">{purpose.description}</p>
                </div>

                {/* Action Buttons: Only show Edit for Active purposes */}
                {purpose.isActive !== false && (
                <div className="flex gap-3 ml-4">
                    <button 
                    onClick={() => handleEdit(purpose)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium transition"
                    >
                    Edit
                    </button>
                    <button 
                    onClick={() => handleRetire(purpose.id)}
                    className="text-red-500 hover:text-red-700 text-sm font-medium transition"
                    >
                    Retire
                    </button>
                </div>
                )}
            </div>
            ))}
        </div>
        </div>
      </div>
    </div>
  );
}