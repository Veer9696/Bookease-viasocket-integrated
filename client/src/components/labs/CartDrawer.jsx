import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useCart } from "../../context/CartContext";
import { useCreateLabBooking } from "../../hooks/useLabTests";
import { useAuth } from "../../context/AuthContext";
import { profileApi } from "../../services/profileApi";
import { useToast } from "../common/Toast";
import Button from "../common/Button";
import FormField, { inputClass } from "../common/FormField";

export default function CartDrawer() {
  const { items, removeItem, clear, total } = useCart();
  const createBooking = useCreateLabBooking();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [scheduledAt, setScheduledAt] = useState("");
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [customAddress, setCustomAddress] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("PAY_ON_COLLECTION");
  const [isExpanded, setIsExpanded] = useState(false);

  // Fetch patient's saved addresses if signed in
  const { data: addresses } = useQuery({
    queryKey: ["saved-addresses"],
    queryFn: profileApi.getAddresses,
    enabled: !!user && user.role === "PATIENT",
  });

  // Calculate itemized charges
  const homePickupFee = total >= 50 ? 0 : 10;
  const grandTotal = total + homePickupFee;

  // Set default address when loaded
  const defaultAddr = useMemo(() => {
    return addresses?.find((a) => a.isDefault) || addresses?.[0];
  }, [addresses]);

  const effectiveAddressId = selectedAddressId || (defaultAddr?.id || "");

  if (items.length === 0) return null;

  async function handleCheckout() {
    if (!scheduledAt) {
      showToast("Please choose a home sample collection date and time", "error");
      return;
    }

    if (!effectiveAddressId && !customAddress.trim()) {
      showToast("Please select a saved address or enter a pickup address", "error");
      return;
    }

    try {
      await createBooking.mutateAsync({
        scheduledAt: new Date(scheduledAt).toISOString(),
        items: items.map((i) => ({ labTestId: i.id })),
        addressId: effectiveAddressId || undefined,
        address: customAddress.trim() || undefined,
        paymentStatus,
      });
      showToast("Lab test booking confirmed! A technician will visit your address.", "success");
      clear();
      setScheduledAt("");
      setCustomAddress("");
      setIsExpanded(false);
      navigate("/dashboard");
    } catch (err) {
      showToast(err.message || "Could not book tests", "error");
    }
  }

  // Format min date for datetime-local (now + 2 hours)
  const minDateTime = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16);

  return (
    <aside
      className="fixed bottom-0 right-0 z-30 w-full max-w-md rounded-t-2xl border border-gray-200 bg-white p-5 shadow-2xl transition-all sm:bottom-4 sm:right-4 sm:rounded-2xl"
      aria-label="Lab Test Cart & Checkout"
    >
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
            {items.length}
          </span>
          <h3 className="font-bold text-gray-900">Lab Test Cart</h3>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs font-semibold text-primary hover:underline"
          >
            {isExpanded ? "Collapse ▲" : "View Details & Checkout ▼"}
          </button>
          <button
            type="button"
            onClick={clear}
            className="text-xs text-gray-400 hover:text-red-600 transition"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Item List */}
      <div className="mt-3 max-h-36 space-y-1.5 overflow-y-auto pr-1">
        {items.map((i) => (
          <div key={i.id} className="flex items-center justify-between text-sm py-1 border-b border-gray-50">
            <div>
              <p className="font-medium text-gray-800">{i.name}</p>
              <p className="text-xs text-gray-500">${i.price}</p>
            </div>
            <button
              onClick={() => removeItem(i.id)}
              className="text-xs font-semibold text-red-500 hover:text-red-700"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      {/* Itemized Bill Breakdown */}
      <div className="mt-4 rounded-xl bg-gray-50 p-3.5 space-y-1.5 text-xs text-gray-600">
        <div className="flex justify-between">
          <span>Lab tests subtotal ({items.length}):</span>
          <span className="font-semibold text-gray-900">${total}</span>
        </div>
        <div className="flex justify-between">
          <span>Home sample collection fee:</span>
          <span>
            {homePickupFee === 0 ? (
              <span className="font-semibold text-emerald-600">FREE (Orders $50+)</span>
            ) : (
              `$${homePickupFee}`
            )}
          </span>
        </div>
        <div className="flex justify-between border-t border-gray-200 pt-1.5 text-sm font-bold text-gray-900">
          <span>Total Itemized Bill:</span>
          <span className="text-primary">${grandTotal}</span>
        </div>
      </div>

      {/* Expanded Checkout Form */}
      {isExpanded && user && user.role === "PATIENT" && (
        <div className="mt-4 space-y-3.5 border-t border-gray-100 pt-3">
          {/* Pickup Address Selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Sample Collection Address
            </label>
            {addresses && addresses.length > 0 ? (
              <select
                className={inputClass}
                value={effectiveAddressId}
                onChange={(e) => {
                  setSelectedAddressId(e.target.value);
                  if (e.target.value !== "custom") setCustomAddress("");
                }}
              >
                {addresses.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}: {a.street}, {a.city} {a.isDefault ? "(Default)" : ""}
                  </option>
                ))}
                <option value="custom">+ Enter a different pickup address...</option>
              </select>
            ) : null}

            {(!addresses || addresses.length === 0 || effectiveAddressId === "custom") && (
              <input
                type="text"
                placeholder="Enter complete home pickup address..."
                className={`${inputClass} mt-1.5`}
                value={customAddress}
                onChange={(e) => setCustomAddress(e.target.value)}
              />
            )}
          </div>

          {/* Collection Time */}
          <FormField label="Preferred Collection Date & Time">
            <input
              type="datetime-local"
              min={minDateTime}
              className={inputClass}
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              required
            />
          </FormField>

          {/* Payment Status / Method */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Payment Method</label>
            <div className="grid grid-cols-2 gap-2">
              <label
                className={`flex items-center gap-2 rounded-lg border p-2 text-xs font-medium cursor-pointer transition ${
                  paymentStatus === "PAY_ON_COLLECTION"
                    ? "border-primary bg-primary-light/30 text-primary font-semibold"
                    : "border-gray-200 text-gray-700"
                }`}
              >
                <input
                  type="radio"
                  name="labPayment"
                  value="PAY_ON_COLLECTION"
                  checked={paymentStatus === "PAY_ON_COLLECTION"}
                  onChange={() => setPaymentStatus("PAY_ON_COLLECTION")}
                  className="sr-only"
                />
                <span>💵 Pay on Collection</span>
              </label>

              <label
                className={`flex items-center gap-2 rounded-lg border p-2 text-xs font-medium cursor-pointer transition ${
                  paymentStatus === "PAID_ONLINE"
                    ? "border-primary bg-primary-light/30 text-primary font-semibold"
                    : "border-gray-200 text-gray-700"
                }`}
              >
                <input
                  type="radio"
                  name="labPayment"
                  value="PAID_ONLINE"
                  checked={paymentStatus === "PAID_ONLINE"}
                  onChange={() => setPaymentStatus("PAID_ONLINE")}
                  className="sr-only"
                />
                <span>💳 Pay Online (Demo)</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-4">
        {user && user.role === "PATIENT" ? (
          !isExpanded ? (
            <Button className="w-full" onClick={() => setIsExpanded(true)}>
              Proceed to Checkout (${grandTotal})
            </Button>
          ) : (
            <Button
              className="w-full"
              loading={createBooking.isPending}
              onClick={handleCheckout}
            >
              Confirm & Book Lab Collection (${grandTotal})
            </Button>
          )
        ) : !user ? (
          <div className="space-y-2">
            <p className="text-xs text-gray-500">Sign in as a patient to confirm home collection.</p>
            <Button className="w-full" onClick={() => navigate("/login")}>
              Log in to checkout
            </Button>
          </div>
        ) : (
          <p className="text-center text-xs text-gray-500">
            Only Patient accounts can book home lab tests.
          </p>
        )}
      </div>
    </aside>
  );
}
