import React, { useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";

export default function Profile() {

  const { user } = useAuth0();
  const [name, setName] = useState(
  user?.name || ""
);
const [saved, setSaved] = useState(false);
const saveProfile = () => {

  localStorage.setItem(
    "userName",
    name
  );

  localStorage.setItem(
    "userPhone",
    phone
  );

  setSaved(true);

  setTimeout(() => {
    setSaved(false);
  }, 3000);

};

const [phone, setPhone] = useState(
  localStorage.getItem("userPhone") || ""
);

  return (

    <div className="max-w-4xl mx-auto">

      <p
        onClick={() => window.history.back()}
        className="text-gray-500 cursor-pointer mb-6"
      >
        ← Back
      </p>
      <div className="bg-white border rounded-xl p-8 shadow-sm">

  <h2 className="text-2xl font-bold mb-6">
    Profile Information
  </h2>

  <div className="space-y-5">

    {/* Name */}

    <div>

      <label className="block text-sm font-medium mb-2">
        Full Name
      </label>

      <input
        type="text"
        value={name}
        onChange={(e) =>
          setName(e.target.value)
        }
        className="
        w-full
        border
        rounded-lg
        p-3
        "
      />

    </div>

    {/* Email */}

    <div>

      <label className="block text-sm font-medium mb-2">
        Email Address
      </label>

      <input
        type="text"
        value={user?.email}
        readOnly
        className="
        w-full
        border
        rounded-lg
        p-3
        bg-gray-100
        "
      />

    </div>

    {/* Phone */}

    <div>

      <label className="block text-sm font-medium mb-2">
        Phone Number
      </label>

      <input
        type="text"
        value={phone}
        onChange={(e) =>
          setPhone(e.target.value)
        }
        placeholder="+91 9876543210"
        className="
        w-full
        border
        rounded-lg
        p-3
        "
      />

    </div>

    {/* Save */}

    <button
      className="
      bg-blue-600
      text-white
      px-6
      py-3
      rounded-lg
      "
      onClick={saveProfile}
    >
      Save Changes
    </button>
    {saved && (

  <p className="text-green-600 mt-4 font-medium">
    ✅ Profile Updated Successfully
  </p>

)}

  </div>

</div>
      

      </div>


  );
}