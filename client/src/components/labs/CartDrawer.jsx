import { useState } from "react";
import { useCart } from "../../context/CartContext";
import { useCreateLabBooking } from "../../hooks/useLabTests";
import { useToast } from "../common/Toast";
import Button from "../common/Button";
import FormField, { inputClass } from "../common/FormField";

export default function CartDrawer() {
  const { items, removeItem, clear, total } = useCart();
  const createBooking = useCreateLabBooking();
  const { showToast } = useToast();
  const [scheduledAt, setScheduledAt] = useState("");

  if (items.length === 0) return null;

  async function handleCheckout() {
    if (!scheduledAt) {
      showToast("Pick a date and time first", "error");
      return;
    }
    try {
      await createBooking.mutateAsync({
        scheduledAt: new Date(scheduledAt).toISOString(),
        items: items.map((i) => ({ labTestId: i.id })),
      });
      showToast("Lab tests booked! Check your dashboard for status.", "success");
      clear();
      setScheduledAt("");
    } catch (err) {
      showToast(err.message || "Could not book tests", "error");
    }
  }

  return (
    <div className="fixed bottom-0 right-0 z-20 w-full max-w-sm rounded-t-card border border-gray-200 bg-white p-4 shadow-xl sm:bottom-4 sm:right-4 sm:rounded-card">
      <h3 className="font-semibold text-gray-900">Your cart</h3>
      <div className="mt-2 max-h-40 space-y-1 overflow-y-auto">
        {items.map((i) => (
          <div key={i.id} className="flex justify-between text-sm">
            <span>{i.name}</span>
            <button onClick={() => removeItem(i.id)} className="text-danger">Remove</button>
          </div>
        ))}
      </div>
      <p className="mt-2 text-right font-semibold">Total: ${total}</p>

      <div className="mt-3">
        <FormField label="Collection date & time">
          <input type="datetime-local" className={inputClass} value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)} />
        </FormField>
      </div>

      <Button className="mt-3 w-full" loading={createBooking.isPending} onClick={handleCheckout}>
        Book tests
      </Button>
    </div>
  );
}
