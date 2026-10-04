import { useEffect, useState } from "react";
import { doctorsApi } from "../../services/doctorsApi";
import Button from "../common/Button";
import { useToast } from "../common/Toast";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function AvailabilityEditor({ doctor }) {
  const { showToast } = useToast();
  const [slots, setSlots] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSlots(
      DAYS.map((_, dayOfWeek) => {
        const existing = doctor.availability?.find((a) => a.dayOfWeek === dayOfWeek);
        return existing
          ? { ...existing, enabled: true }
          : { dayOfWeek, startTime: "09:00", endTime: "17:00", slotDurationMins: 30, enabled: false };
      })
    );
  }, [doctor]);

  function updateDay(dayOfWeek, patch) {
    setSlots((prev) => prev.map((s) => (s.dayOfWeek === dayOfWeek ? { ...s, ...patch } : s)));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const enabledSlots = slots
        .filter((s) => s.enabled)
        .map(({ dayOfWeek, startTime, endTime, slotDurationMins }) => ({ dayOfWeek, startTime, endTime, slotDurationMins }));
      await doctorsApi.setAvailability(enabledSlots);
      showToast("Availability updated", "success");
    } catch (err) {
      showToast(err.message || "Could not save availability", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-card border border-gray-100 bg-white p-4 shadow-sm">
      <h3 className="font-semibold text-gray-900">Weekly availability</h3>
      <div className="mt-3 space-y-2">
        {slots.map((s) => (
          <div key={s.dayOfWeek} className="flex flex-wrap items-center gap-3 text-sm">
            <label className="flex w-28 items-center gap-2">
              <input type="checkbox" checked={s.enabled} onChange={(e) => updateDay(s.dayOfWeek, { enabled: e.target.checked })} />
              {DAYS[s.dayOfWeek]}
            </label>
            <input type="time" value={s.startTime} disabled={!s.enabled}
              onChange={(e) => updateDay(s.dayOfWeek, { startTime: e.target.value })}
              className="rounded border border-gray-300 px-2 py-1 disabled:bg-gray-100" />
            <span>to</span>
            <input type="time" value={s.endTime} disabled={!s.enabled}
              onChange={(e) => updateDay(s.dayOfWeek, { endTime: e.target.value })}
              className="rounded border border-gray-300 px-2 py-1 disabled:bg-gray-100" />
          </div>
        ))}
      </div>
      <Button className="mt-4" loading={saving} onClick={handleSave}>Save availability</Button>
    </div>
  );
}
