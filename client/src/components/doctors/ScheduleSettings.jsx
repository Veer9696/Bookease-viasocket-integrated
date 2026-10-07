import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { doctorsApi } from "../../services/doctorsApi";
import Button from "../common/Button";
import FormField, { inputClass } from "../common/FormField";
import { useToast } from "../common/Toast";

const BUFFER_OPTIONS = [0, 5, 10, 15, 20, 30];

function todayYmd() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function ScheduleSettings({ doctor }) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const refreshProfile = () => queryClient.invalidateQueries({ queryKey: ["my-doctor-profile"] });

  const [bufferMins, setBufferMins] = useState(doctor.bufferMins ?? 0);
  const [locationUrl, setLocationUrl] = useState(doctor.locationUrl || "");
  const [phone, setPhone] = useState(doctor.user?.phone || "");
  const [leave, setLeave] = useState({ startDate: "", endDate: "", reason: "" });

  const saveSettings = useMutation({
    mutationFn: () =>
      doctorsApi.updateSettings({ bufferMins: Number(bufferMins), locationUrl: locationUrl.trim(), phone: phone.trim() }),
    onSuccess: () => {
      refreshProfile();
      showToast("Schedule settings saved", "success");
    },
    onError: (err) => showToast(err.message, "error"),
  });

  const addLeave = useMutation({
    mutationFn: () =>
      doctorsApi.addLeave({
        startDate: leave.startDate,
        endDate: leave.endDate || leave.startDate,
        ...(leave.reason ? { reason: leave.reason } : {}),
      }),
    onSuccess: (res) => {
      refreshProfile();
      setLeave({ startDate: "", endDate: "", reason: "" });
      showToast(res.blockedDays ? `Blocked ${res.blockedDays} day(s)` : "Those days were already blocked", "success");
    },
    onError: (err) => showToast(err.message, "error"),
  });

  const removeLeave = useMutation({
    mutationFn: doctorsApi.removeLeave,
    onSuccess: refreshProfile,
    onError: (err) => showToast(err.message, "error"),
  });

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-card border border-gray-100 bg-white p-4 shadow-sm">
        <h3 className="font-semibold text-gray-900">Slot & contact settings</h3>
        <div className="mt-3 space-y-3">
          <FormField label="Contact phone (shown in appointment emails)">
            <input
              type="tel"
              className={inputClass}
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </FormField>
          <p className="-mt-2 text-xs text-gray-500">Emails go to {doctor.user?.email || "your login email"}.</p>
          <FormField label="Buffer between appointments">
            <select className={inputClass} value={bufferMins} onChange={(e) => setBufferMins(e.target.value)}>
              {BUFFER_OPTIONS.map((m) => (
                <option key={m} value={m}>{m === 0 ? "No buffer" : `${m} minutes`}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Clinic location link (used in WhatsApp/SMS confirmations)">
            <input
              type="url"
              className={inputClass}
              placeholder="https://maps.google.com/..."
              value={locationUrl}
              onChange={(e) => setLocationUrl(e.target.value)}
            />
          </FormField>
          <p className="text-xs text-gray-500">Leave blank to use a Google Maps search for your clinic name.</p>
          <Button loading={saveSettings.isPending} onClick={() => saveSettings.mutate()}>Save settings</Button>
        </div>
      </div>

      <div className="rounded-card border border-gray-100 bg-white p-4 shadow-sm">
        <h3 className="font-semibold text-gray-900">Leave & blocked dates</h3>
        <p className="mt-1 text-xs text-gray-500">Blocked days show no slots to patients. Your weekly hours stay as they are.</p>
        <form
          className="mt-3 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (leave.startDate) addLeave.mutate();
          }}
        >
          <div className="grid grid-cols-2 gap-2">
            <FormField label="From">
              <input type="date" required min={todayYmd()} className={inputClass} value={leave.startDate}
                onChange={(e) => setLeave({ ...leave, startDate: e.target.value })} />
            </FormField>
            <FormField label="To (optional)">
              <input type="date" min={leave.startDate || todayYmd()} className={inputClass} value={leave.endDate}
                onChange={(e) => setLeave({ ...leave, endDate: e.target.value })} />
            </FormField>
          </div>
          <FormField label="Reason (private, optional)">
            <input className={inputClass} placeholder="Vacation, conference..." value={leave.reason}
              onChange={(e) => setLeave({ ...leave, reason: e.target.value })} />
          </FormField>
          <Button type="submit" loading={addLeave.isPending}>Block dates</Button>
        </form>

        <ul className="mt-4 max-h-48 space-y-1 overflow-y-auto">
          {doctor.timeOff?.length === 0 && <li className="text-sm text-gray-400">No upcoming blocked dates.</li>}
          {doctor.timeOff?.map((t) => (
            <li key={t.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
              <span>
                {new Date(t.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                {t.reason && <span className="text-gray-400"> · {t.reason}</span>}
              </span>
              <button onClick={() => removeLeave.mutate(t.id)} className="text-xs text-danger hover:underline">
                Unblock
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
