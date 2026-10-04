import { Link } from "react-router-dom";

export default function DoctorCard({ doctor }) {
  return (
    <div className="flex flex-col items-center rounded-card border border-gray-100 bg-white p-6 text-center shadow-sm transition hover:shadow-md">
      <img src={doctor.image} alt={doctor.user?.name} className="h-20 w-20 rounded-full object-cover" />
      <h3 className="mt-3 font-semibold text-gray-900">{doctor.user?.name}</h3>
      <p className="text-sm text-primary">{doctor.specialty}</p>
      <p className="mt-1 text-xs text-gray-500">{doctor.clinic}</p>
      <p className="mt-2 text-sm text-gray-600">⭐ {doctor.rating?.toFixed(1)} · ${doctor.fee}</p>
      <Link to={`/doctors/${doctor.id}`} className="mt-4 w-full">
        <button className="w-full rounded-full border border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-primary-light">
          View profile
        </button>
      </Link>
    </div>
  );
}
