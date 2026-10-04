import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ApiClientError } from "../services/apiClient";
import FormField, { inputClass } from "../components/common/FormField";
import ErrorBanner from "../components/common/ErrorBanner";
import Button from "../components/common/Button";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

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
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <ErrorBanner message={error} />
        <FormField label="Email">
          <input type="email" required className={inputClass} value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </FormField>
        <FormField label="Password">
          <input type="password" required className={inputClass} value={form.password}
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
