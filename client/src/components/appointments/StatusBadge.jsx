const STYLES = {
  PENDING: "bg-warning/10 text-warning",
  CONFIRMED: "bg-success/10 text-success",
  CANCELLED: "bg-gray-200 text-gray-600",
  REJECTED: "bg-danger/10 text-danger",
  COMPLETED: "bg-primary-light text-primary",
};

export default function StatusBadge({ status }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${STYLES[status] || "bg-gray-100 text-gray-600"}`}>
      {status.toLowerCase()}
    </span>
  );
}
