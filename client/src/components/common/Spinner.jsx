export default function Spinner({ label = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-gray-500">
      <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary-light border-t-primary" />
      <p>{label}</p>
    </div>
  );
}
