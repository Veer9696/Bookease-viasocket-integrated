import { useState } from "react";
import { useDoctors } from "../../hooks/useDoctors";
import DoctorCard from "./DoctorCard";
import Spinner from "../common/Spinner";
import EmptyState from "../common/EmptyState";
import ErrorBanner from "../common/ErrorBanner";
import Button from "../common/Button";
import { inputClass } from "../common/FormField";

const COMMON_SPECIALTIES = [
  "All Specialties",
  "Cardiology",
  "Neurology",
  "Dermatology",
  "Orthopedics",
  "Gynecology",
  "Pediatrics",
];

export default function DoctorSearchFilters({ showTitle = true }) {
  const [specialty, setSpecialty] = useState("");
  const [minFee, setMinFee] = useState("");
  const [maxFee, setMaxFee] = useState("");
  const [gender, setGender] = useState("");
  const [availableToday, setAvailableToday] = useState(false);

  // Active filter payload passed to useDoctors
  const filterParams = {
    specialty: specialty === "All Specialties" ? "" : specialty,
    minFee,
    maxFee,
    gender,
    availableToday,
  };

  const { data: doctors, isLoading, error } = useDoctors(filterParams);

  function resetFilters() {
    setSpecialty("");
    setMinFee("");
    setMaxFee("");
    setGender("");
    setAvailableToday(false);
  }

  const hasActiveFilters =
    Boolean(specialty) ||
    Boolean(minFee) ||
    Boolean(maxFee) ||
    Boolean(gender) ||
    availableToday;

  return (
    <div className="space-y-6">
      {showTitle && (
        <div>
          <h2 className="text-xl font-bold text-gray-900">Find & Filter Doctors</h2>
          <p className="mt-1 text-sm text-gray-500">
            Search top specialists by specialty, fee, gender, and immediate availability.
          </p>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="rounded-card border border-gray-100 bg-white p-5 shadow-sm space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Specialty Filter */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
              Specialty
            </label>
            <div className="space-y-1.5">
              <select
                className={inputClass}
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
              >
                <option value="">Any specialty</option>
                {COMMON_SPECIALTIES.filter((s) => s !== "All Specialties").map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Consultation Fee Range */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
              Fee Range ($)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                min="0"
                className={inputClass}
                value={minFee}
                onChange={(e) => setMinFee(e.target.value)}
              />
              <span className="text-gray-400">–</span>
              <input
                type="number"
                placeholder="Max"
                min="0"
                className={inputClass}
                value={maxFee}
                onChange={(e) => setMaxFee(e.target.value)}
              />
            </div>
          </div>

          {/* Doctor Gender */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
              Doctor Gender
            </label>
            <select
              className={inputClass}
              value={gender}
              onChange={(e) => setGender(e.target.value)}
            >
              <option value="">All genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Availability Toggle */}
          <div className="flex flex-col justify-end">
            <label className="flex items-center gap-2.5 h-10 px-3 rounded-lg border border-gray-200 bg-gray-50/70 hover:bg-gray-100/70 cursor-pointer transition select-none">
              <input
                type="checkbox"
                checked={availableToday}
                onChange={(e) => setAvailableToday(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm font-medium text-gray-800">
                ⚡ Available Today
              </span>
            </label>
          </div>
        </div>

        {/* Quick pills / Reset */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>
              Showing <strong>{doctors?.length || 0}</strong> doctor{doctors?.length === 1 ? "" : "s"}
            </span>
          </div>

          {hasActiveFilters && (
            <Button size="sm" variant="ghost" onClick={resetFilters}>
              Reset all filters
            </Button>
          )}
        </div>
      </div>

      {/* Doctor Grid / Empty state */}
      <div>
        {isLoading && <Spinner />}
        <ErrorBanner message={error?.message} />

        {!isLoading && doctors?.length === 0 && (
          <EmptyState
            title="No doctors match your criteria"
            description="Try loosening your filters or clearing fee/availability restrictions."
            action={
              hasActiveFilters && (
                <Button variant="secondary" size="sm" onClick={resetFilters}>
                  Clear filters
                </Button>
              )
            }
          />
        )}

        {!isLoading && doctors && doctors.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {doctors.map((d) => (
              <DoctorCard key={d.id} doctor={d} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
