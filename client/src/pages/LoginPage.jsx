import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ApiClientError } from "../services/apiClient";
import FormField, { inputClass } from "../components/common/FormField";
import PasswordInput from "../components/common/PasswordInput";
import ErrorBanner from "../components/common/ErrorBanner";
import Button from "../components/common/Button";
import GoogleButton, { OrDivider } from "../components/common/GoogleButton";

// The server redirects here with a code (never free text) when Google sign-in fails.
const OAUTH_ERRORS = {
  cancelled: "Google sign-in was cancelled.",
  expired: "Your Google sign-in session expired. Please try again.",
  conflict: "This email is already registered with a different login method or Google account.",
  failed: "We couldn't sign you in with Google. Please try again.",
  not_configured: "Google sign-in isn't available right now.",
};

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const oauthErr = searchParams.get("oauthError");
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState(() => (oauthErr ? OAUTH_ERRORS[oauthErr] || "Google sign-in failed." : null));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate(user.role === "DOCTOR" ? "/doctor/dashboard" : "/dashboard", { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    if (oauthErr) {
      setError(OAUTH_ERRORS[oauthErr] || "Google sign-in failed.");
    }
  }, [oauthErr]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await login(form);
      navigate(user.role === "DOCTOR" ? "/doctor/dashboard" : "/dashboard");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not log in");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-2xl font-bold text-gray-900">Log in</h1>
      <div className="mt-6 space-y-4">
        <ErrorBanner message={error} />
        <GoogleButton from="login" />
      </div>
      <OrDivider />
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Email">
          <input type="email" required className={inputClass} value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </FormField>
        <FormField label="Password">
          <PasswordInput required value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </FormField>
        <Button type="submit" loading={loading} className="w-full">Log in</Button>
      </form>
      <p className="mt-4 text-sm text-gray-500">
        No account? <Link to="/register" className="text-primary hover:underline">Sign up</Link>
      </p>
    </div>
  );
}
