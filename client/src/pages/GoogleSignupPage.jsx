import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../services/authApi";
import { ApiClientError } from "../services/apiClient";
import FormField, { inputClass } from "../components/common/FormField";
import ErrorBanner from "../components/common/ErrorBanner";
import Button from "../components/common/Button";
import Spinner from "../components/common/Spinner";

const ROLES = [
  { value: "PATIENT", title: "Patient", description: "Book appointments and lab tests" },
  { value: "DOCTOR", title: "Doctor", description: "Manage your schedule and patients" },
];

// Second step of Google sign-up: the server holds the verified Google profile
// in a short-lived cookie until the new user picks a role here.
export default function GoogleSignupPage() {
  const { user, completeGoogleSignup } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [expired, setExpired] = useState(false);
  const [form, setForm] = useState({ role: "PATIENT", phone: "", specialty: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate(user.role === "DOCTOR" ? "/doctor/dashboard" : "/dashboard", { replace: true });
      return;
    }
    authApi
      .googlePending()
      .then((res) => setProfile(res.profile))
      .catch(() => setExpired(true));
  }, [user, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await completeGoogleSignup(form);
      navigate(user.role === "DOCTOR" ? "/doctor/dashboard" : "/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not create account");
    } finally {
      setLoading(false);
    }
  }

  if (expired) {
    return (
      <div className="mx-auto max-w-sm px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Session expired</h1>
        <p className="mt-2 text-sm text-gray-500">Your Google sign-up took too long. Please start again.</p>
        <Link to="/register" className="mt-6 inline-block text-primary hover:underline">Back to sign up</Link>
      </div>
    );
  }

  if (!profile) return <Spinner label="Loading your Google profile..." />;

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-2xl font-bold text-gray-900">Finish signing up</h1>

      <div className="mt-6 flex items-center gap-3 rounded-card border border-gray-200 p-3">
        {profile.avatarUrl ? (
          <img src={profile.avatarUrl} alt="" referrerPolicy="no-referrer" className="h-10 w-10 rounded-full" />
        ) : (
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-light font-semibold text-primary">
            {profile.name.charAt(0).toUpperCase()}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate font-medium text-gray-900">{profile.name}</p>
          <p className="truncate text-sm text-gray-500">{profile.email}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <ErrorBanner message={error} />

        <fieldset>
          <legend className="mb-2 block text-sm font-medium text-gray-700">I'm signing up as a</legend>
          <div className="grid grid-cols-2 gap-3">
            {ROLES.map((r) => (
              <label
                key={r.value}
                className={`cursor-pointer rounded-card border p-3 transition-colors ${
                  form.role === r.value ? "border-primary bg-primary-light" : "border-gray-300 hover:bg-gray-50"
                }`}
              >
                <input type="radio" name="role" value={r.value} className="sr-only"
                  checked={form.role === r.value} onChange={() => setForm({ ...form, role: r.value })} />
                <span className="block font-medium text-gray-900">{r.title}</span>
                <span className="mt-0.5 block text-xs text-gray-500">{r.description}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {form.role === "DOCTOR" && (
          <FormField label="Specialty">
            <input required className={inputClass} value={form.specialty}
              onChange={(e) => setForm({ ...form, specialty: e.target.value })} />
          </FormField>
        )}

        <FormField label="Phone (for appointment updates)">
          <input type="tel" required placeholder="+91 98765 43210" pattern="\+?[\d\s()\-]{7,20}"
            title="Enter a valid phone number" className={inputClass} value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </FormField>

        <Button type="submit" loading={loading} className="w-full">Create account</Button>
      </form>
    </div>
  );
}
