import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ApiClientError } from "../services/apiClient";
import FormField, { inputClass } from "../components/common/FormField";
import ErrorBanner from "../components/common/ErrorBanner";
import Button from "../components/common/Button";

const initialForm = { name: "", email: "", password: "", phone: "", role: "PATIENT", specialty: "" };

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

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
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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

        <FormField label="Phone (optional)">
          <input className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </FormField>

        <FormField label="Password">
          <input type="password" required minLength={8} className={inputClass} value={form.password}
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
