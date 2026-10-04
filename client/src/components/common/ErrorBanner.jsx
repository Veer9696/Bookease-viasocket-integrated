export default function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div className="rounded-lg border border-danger/30 bg-red-50 px-4 py-3 text-sm text-danger">
      {message}
    </div>
  );
}
