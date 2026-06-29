import React, { useEffect, useMemo, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";

export default function Profile() {
  const { user } = useAuth0();

  const storagePrefix = useMemo(() => {
    return user?.sub ? `profile:${user.sub}` : "profile:anonymous";
  }, [user?.sub]);

  const defaultName = useMemo(() => {
    if (user?.name && user.name !== user?.email) return user.name;
    if (user?.nickname) return user.nickname;
    if (user?.email) return user.email.split("@")[0];
    return "";
  }, [user?.name, user?.nickname, user?.email]);

  const [name, setName] = useState(defaultName);
  const [phone, setPhone] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const savedName = localStorage.getItem(`${storagePrefix}:name`);
    const savedPhone = localStorage.getItem(`${storagePrefix}:phone`);

    setName(savedName || defaultName);
    setPhone(savedPhone || "");
  }, [storagePrefix, defaultName]);

  const saveProfile = () => {
    localStorage.setItem(`${storagePrefix}:name`, name.trim());
    localStorage.setItem(`${storagePrefix}:phone`, phone.trim());

    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 3000);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <p
        onClick={() => window.history.back()}
        className="text-gray-500 cursor-pointer mb-6 hover:text-blue-600 transition"
      >
        &lt;- Back
      </p>

      <div className="bg-white border rounded-xl p-8 shadow-sm">
        <h2 className="text-2xl font-bold mb-6">
          Profile Information
        </h2>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2">
              Full Name
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full border rounded-lg p-3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Email Address
            </label>

            <input
              type="text"
              value={user?.email || ""}
              readOnly
              className="w-full border rounded-lg p-3 bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Phone Number
            </label>

            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 9876543210"
              className="w-full border rounded-lg p-3"
            />
          </div>

          <button
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            onClick={saveProfile}
          >
            Save Changes
          </button>

          {saved && (
            <p className="text-green-600 mt-4 font-medium">
              Profile updated successfully.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}