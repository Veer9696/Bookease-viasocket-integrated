import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ApiClientError } from "../services/apiClient";
import FormField, { inputClass } from "../components/common/FormField";
import PasswordInput from "../components/common/PasswordInput";
import ErrorBanner from "../components/common/ErrorBanner";
import Button from "../components/common/Button";
import GoogleButton, { OrDivider } from "../components/common/GoogleButton";

const OAUTH_ERRORS = {
  cancelled: "Google sign-up was cancelled.",
  expired: "Your Google sign-up session expired. Please try again.",
  conflict: "This email is already registered with a different login method or Google account.",
  failed: "We couldn't sign you up with Google. Please try again.",
  not_configured: "Google sign-in isn't available right now.",
};

const initialForm = { name: "", email: "", password: "", phone: "", role: "PATIENT", specialty: "" };

export default function RegisterPage() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const oauthErr = searchParams.get("oauthError");
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState(() => (oauthErr ? OAUTH_ERRORS[oauthErr] || "Google sign-up failed." : null));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate(user.role === "DOCTOR" ? "/doctor/dashboard" : "/dashboard", { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    if (oauthErr) {
      setError(OAUTH_ERRORS[oauthErr] || "Google sign-up failed.");
    }
  }, [oauthErr]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await register(form);
      navigate(user.role === "DOCTOR" ? "/doctor/dashboard" : "/dashboard");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not create account");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
      <div className="mt-6">
        <GoogleButton from="register">Sign up with Google</GoogleButton>
        <p className="mt-2 text-center text-xs text-gray-500">You'll choose Patient or Doctor next.</p>
      </div>
      <OrDivider />
      <form onSubmit={handleSubmit} className="space-y-4">
        <ErrorBanner message={error} />

        <FormField label="I am a">
          <select className={inputClass} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="PATIENT">Patient</option>
            <option value="DOCTOR">Doctor</option>
          </select>
        </FormField>

        <FormField label="Full name">
          <input required className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </FormField>

        {form.role === "DOCTOR" && (
          <FormField label="Specialty">
            <input required className={inputClass} value={form.specialty}
              onChange={(e) => setForm({ ...form, specialty: e.target.value })} />
          </FormField>
        )}

        <FormField label="Email">
          <input type="email" required className={inputClass} value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </FormField>

        <FormField label="Phone (for appointment updates)">
          <input type="tel" required placeholder="+91 98765 43210" pattern="\+?[\d\s()\-]{7,20}"
            title="Enter a valid phone number" className={inputClass} value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </FormField>

        <FormField label="Password">
          <PasswordInput required minLength={8} value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </FormField>

        <Button type="submit" loading={loading} className="w-full">Create account</Button>
      </form>
      <p className="mt-4 text-sm text-gray-500">
        Already have an account? <Link to="/login" className="text-primary hover:underline">Log in</Link>
      </p>
    </div>
  );
}
