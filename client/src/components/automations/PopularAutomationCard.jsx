export default function PopularAutomationCard({ icon, title, description, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-start gap-2 rounded-card border border-gray-100 bg-white p-5 text-left shadow-sm transition hover:border-primary hover:shadow-md"
    >
      <span className="text-3xl">{icon}</span>
      <h3 className="font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500">{description}</p>
    </button>
  );
}
