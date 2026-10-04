import { useCart } from "../../context/CartContext";

export default function LabTestCard({ test }) {
  const { items, addItem, removeItem } = useCart();
  const inCart = items.some((i) => i.id === test.id);

  return (
    <div className="flex items-center justify-between rounded-card border border-gray-100 bg-white p-4 shadow-sm">
      <div>
        <p className="font-semibold text-gray-900">{test.name}</p>
        <p className="text-sm text-gray-500">{test.description}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-semibold text-gray-900">${test.price}</span>
        <button
          onClick={() => (inCart ? removeItem(test.id) : addItem(test))}
          className={`rounded-full px-4 py-2 text-sm font-medium ${
            inCart ? "bg-gray-200 text-gray-600" : "bg-primary text-white hover:bg-primary-dark"
          }`}
        >
          {inCart ? "Remove" : "Add"}
        </button>
      </div>
    </div>
  );
}
