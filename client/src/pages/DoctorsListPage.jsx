import { useState } from "react";
import { useDoctors } from "../hooks/useDoctors";
import DoctorCard from "../components/doctors/DoctorCard";
import Spinner from "../components/common/Spinner";
import EmptyState from "../components/common/EmptyState";
import ErrorBanner from "../components/common/ErrorBanner";
import { inputClass } from "../components/common/FormField";

export default function DoctorsListPage() {
  const [specialty, setSpecialty] = useState("");
  const { data: doctors, isLoading, error } = useDoctors(specialty || undefined);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Find a doctor</h1>
        <input
          placeholder="Filter by specialty..."
          className={`${inputClass} max-w-xs`}
          value={specialty}
          onChange={(e) => setSpecialty(e.target.value)}
        />
      </div>

      <div className="mt-6">
        {isLoading && <Spinner />}
        <ErrorBanner message={error?.message} />
        {!isLoading && doctors?.length === 0 && (
          <EmptyState title="No doctors found" description="Try a different specialty." />
        )}
        {!isLoading && doctors?.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {doctors.map((d) => <DoctorCard key={d.id} doctor={d} />)}
          </div>
        )}
      </div>
    </div>
  );
}
