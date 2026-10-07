import DoctorSearchFilters from "../components/doctors/DoctorSearchFilters";

export default function DoctorsListPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <DoctorSearchFilters showTitle={true} />
    </div>
  );
}
