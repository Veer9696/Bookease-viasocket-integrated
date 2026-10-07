import { Link } from "react-router-dom";

export default function DoctorCard({ doctor }) {
  const avatar = doctor.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.user?.name || "Dr")}&background=E1EFFE&color=1A56DB&size=150`;

  return (
    <div className="relative flex flex-col items-center rounded-card border border-gray-100 bg-white p-6 text-center shadow-sm transition hover:shadow-md">
      {doctor.availableSlotsToday !== undefined && doctor.availableSlotsToday > 0 && (
        <span className="absolute top-3 right-3 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
          ● Available Today
        </span>
      )}
      <img src={avatar} alt={doctor.user?.name} className="h-20 w-20 rounded-full object-cover border border-gray-100" />
      <h3 className="mt-3 font-semibold text-gray-900">{doctor.user?.name}</h3>
      <p className="text-sm font-medium text-primary">{doctor.specialty}</p>
      
      <div className="mt-1 flex flex-wrap items-center justify-center gap-1.5 text-xs text-gray-500">
        {doctor.clinic && <span>{doctor.clinic}</span>}
        {doctor.gender && <span>· {doctor.gender}</span>}
      </div>

      <p className="mt-2 text-sm text-gray-600">
        ⭐ {doctor.rating > 0 ? doctor.rating.toFixed(1) : "New"} · <strong className="text-gray-900">${doctor.fee}</strong> consultation
      </p>

      {doctor.locationUrl && (
        <a
          href={doctor.locationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 text-xs text-primary hover:underline"
        >
          📍 View clinic map
        </a>
      )}

      <Link to={`/doctors/${doctor.id}`} className="mt-4 w-full">
        <button className="w-full rounded-full border border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-primary-light">
          Book Appointment
        </button>
      </Link>
    </div>
  );
}
