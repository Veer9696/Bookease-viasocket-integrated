export default function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-card border border-dashed border-gray-300 bg-white py-16 text-center">
      <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      {description && <p className="max-w-sm text-sm text-gray-500">{description}</p>}
      {action}
    </div>
  );
}
