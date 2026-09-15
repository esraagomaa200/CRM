import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(user);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditClick = () => {
    setFormData(user);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setFormData(user);
    setError("");
    setIsEditing(false);
  };

  const handleSave = async () => {
    setError("");
    setSaving(true);
    const result = await updateProfile(formData);
    setSaving(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setIsEditing(false);
  };

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Profile</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your personal information and account details.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl mb-5 border border-red-100">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: avatar summary card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="h-20 bg-gradient-to-r from-indigo-500 via-indigo-400 to-purple-500" />
            <div className="px-6 pb-6 -mt-10 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-2xl bg-white p-1 shadow-md">
                <div className="w-full h-full rounded-xl bg-indigo-500 text-white flex items-center justify-center text-2xl font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="font-bold text-lg text-gray-900 mt-3">{user.name}</div>
              <div className="text-gray-500 text-sm">{user.email}</div>

              <span className="mt-3 inline-flex items-center px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-semibold">
                Admin
              </span>

              {!isEditing && (
                <button
                  onClick={handleEditClick}
                  className="mt-6 w-full flex items-center justify-center gap-1.5 bg-indigo-500 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-600 transition shadow-sm"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right: details card */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-5">
              Personal Information
            </h2>

            <div className="grid sm:grid-cols-2 gap-5">
              <Field
                label="Full Name"
                name="name"
                value={isEditing ? formData.name : user.name}
                onChange={handleChange}
                isEditing={isEditing}
              />
              <Field
                label="Email"
                name="email"
                type="email"
                value={isEditing ? formData.email : user.email}
                onChange={handleChange}
                isEditing={isEditing}
              />
              <Field
                label="Date of Birth"
                name="birthDate"
                type="date"
                value={isEditing ? formData.birthDate : user.birthDate}
                onChange={handleChange}
                isEditing={isEditing}
              />
            </div>

            {isEditing && (
              <div className="mt-8 flex gap-3 pt-6 border-t border-gray-100">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-indigo-500 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-600 transition disabled:opacity-60 shadow-sm"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={handleCancel}
                  className="bg-gray-100 text-gray-700 px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, name, value, onChange, isEditing, type = "text" }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label>
      {isEditing ? (
        <input
          type={type}
          name={name}
          value={value || ""}
          onChange={onChange}
          className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
        />
      ) : (
        <div className="text-[15px] text-gray-900 py-2.5 px-0.5 border-b border-gray-50">
          {value || "—"}
        </div>
      )}
    </div>
  );
}