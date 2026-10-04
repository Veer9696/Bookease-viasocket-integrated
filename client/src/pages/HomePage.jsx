import { Link } from "react-router-dom";
import Button from "../components/common/Button";

const FEATURES = [
  { title: "Book in minutes", body: "Find the right doctor and grab a slot that fits your schedule." },
  { title: "Stay on top of care", body: "Track upcoming and past visits, lab tests, and statuses in one place." },
  { title: "Built-in automation", body: "Clinics connect Calendar, Gmail and Slack without writing code." },
];

export default function HomePage() {
  return (
    <div>
      <section className="bg-gradient-to-b from-primary-light to-white px-4 py-20 text-center">
        <h1 className="mx-auto max-w-2xl text-4xl font-bold text-gray-900 sm:text-5xl">
          Smart appointment booking for modern clinics
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-gray-600">
          Browse doctors, book appointments, and manage lab tests — all in one place.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/doctors"><Button>Find a doctor</Button></Link>
          <Link to="/lab-tests"><Button variant="secondary">Book a lab test</Button></Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-6 px-4 py-16 sm:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="rounded-card border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900">{f.title}</h3>
            <p className="mt-2 text-sm text-gray-500">{f.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
