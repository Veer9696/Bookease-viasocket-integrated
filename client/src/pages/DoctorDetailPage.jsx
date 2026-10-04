import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDoctor, useDoctorSlots } from "../hooks/useDoctors";
import Spinner from "../components/common/Spinner";
import ErrorBanner from "../components/common/ErrorBanner";
import Button from "../components/common/Button";

function nextNDays(n) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });
}

export default function DoctorDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: doctor, isLoading, error } = useDoctor(id);
  const [date, setDate] = useState(() => new Date());
  const { data: slots, isLoading: slotsLoading } = useDoctorSlots(id, date);

  if (isLoading) return <Spinner />;
  if (error) return <ErrorBanner message={error.message} />;
  if (!doctor) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-col gap-6 rounded-card border border-gray-100 bg-white p-6 shadow-sm sm:flex-row">
        <img src={doctor.image} alt={doctor.user?.name} className="h-28 w-28 rounded-full object-cover" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{doctor.user?.name}</h1>
          <p className="text-primary">{doctor.specialty}</p>
          <p className="mt-1 text-sm text-gray-500">{doctor.qualifications} · {doctor.experience}</p>
          <p className="mt-1 text-sm text-gray-500">{doctor.clinic}</p>
          <p className="mt-3 text-sm text-gray-700">⭐ {doctor.rating?.toFixed(1)} · Consultation fee: ${doctor.fee}</p>
          {doctor.bio && <p className="mt-2 text-sm text-gray-600">{doctor.bio}</p>}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">Pick a date</h2>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
          {nextNDays(14).map((d) => (
            <button
              key={d.toDateString()}
              onClick={() => setDate(d)}
              className={`shrink-0 rounded-lg border px-4 py-2 text-sm ${
                d.toDateString() === date.toDateString()
                  ? "border-primary bg-primary text-white"
                  : "border-gray-200 text-gray-600 hover:border-primary"
              }`}
            >
              {d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
            </button>
          ))}
        </div>

        <h2 className="mt-6 text-lg font-semibold text-gray-900">Available times</h2>
        {slotsLoading && <Spinner />}
        {!slotsLoading && slots?.length === 0 && (
          <p className="mt-3 text-sm text-gray-500">No open slots on this day. Try another date.</p>
        )}
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {slots?.map((slot) => (
            <Button
              key={slot}
              variant="secondary"
              onClick={() =>
                navigate(`/book?doctorId=${doctor.id}&slot=${encodeURIComponent(slot)}`)
              }
            >
              {new Date(slot).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
