import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { doctorsApi } from "../../services/doctorsApi";
import Button from "../common/Button";
import FormField, { inputClass } from "../common/FormField";
import ErrorBanner from "../common/ErrorBanner";
import { useToast } from "../common/Toast";

export default function DoctorProfileEditor({ doctor }) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [name, setName] = useState(doctor.user?.name || "");
  const [phone, setPhone] = useState(doctor.user?.phone || "");
  const [gender, setGender] = useState(doctor.gender || "");
  const [licenseNumber, setLicenseNumber] = useState(doctor.licenseNumber || "");
  const [qualifications, setQualifications] = useState(doctor.qualifications || "");
  const [fee, setFee] = useState(doctor.fee ?? 0);
  const [clinic, setClinic] = useState(doctor.clinic || "");
  const [clinicAddress, setClinicAddress] = useState(doctor.clinicAddress || "");
  const [locationUrl, setLocationUrl] = useState(doctor.locationUrl || "");
  const [bio, setBio] = useState(doctor.bio || "");
  const [bufferMins, setBufferMins] = useState(doctor.bufferMins ?? 0);
  const [error, setError] = useState(null);

  useEffect(() => {
    setName(doctor.user?.name || "");
    setPhone(doctor.user?.phone || "");
    setGender(doctor.gender || "");
    setLicenseNumber(doctor.licenseNumber || "");
    setQualifications(doctor.qualifications || "");
    setFee(doctor.fee ?? 0);
    setClinic(doctor.clinic || "");
    setClinicAddress(doctor.clinicAddress || "");
    setLocationUrl(doctor.locationUrl || "");
    setBio(doctor.bio || "");
    setBufferMins(doctor.bufferMins ?? 0);
  }, [doctor]);

  const update = useMutation({
    mutationFn: doctorsApi.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-doctor-profile"] });
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
      showToast("Doctor profile updated successfully", "success");
      setError(null);
    },
    onError: (err) => setError(err.message),
  });

  function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    update.mutate({
      name,
      phone,
      gender,
      licenseNumber,
      qualifications,
      fee: Number(fee),
      clinic,
      clinicAddress,
      locationUrl,
      bio,
      bufferMins: Number(bufferMins),
    });
  }

  return (
    <section className="rounded-card border border-gray-100 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-gray-900">Professional Profile & Clinic Info</h2>
      <p className="mt-1 text-sm text-gray-500">
        Update your credentials, consultation fee, clinic location, and booking parameters.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <ErrorBanner message={error} />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Full Name">
            <input
              type="text"
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </FormField>

          <FormField label="Phone Number">
            <input
              type="tel"
              className={inputClass}
              placeholder="+1 555-0100"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </FormField>

          <FormField label="Gender">
            <select
              className={inputClass}
              value={gender}
              onChange={(e) => setGender(e.target.value)}
            >
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </FormField>

          <FormField label="Medical License Number">
            <input
              type="text"
              className={inputClass}
              placeholder="e.g. MED-849201"
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
            />
          </FormField>

          <FormField label="Qualifications / Degrees">
            <input
              type="text"
              className={inputClass}
              placeholder="e.g. MD, FACC, PhD"
              value={qualifications}
              onChange={(e) => setQualifications(e.target.value)}
            />
          </FormField>

          <FormField label="Consultation Fee ($)">
            <input
              type="number"
              min="0"
              step="5"
              className={inputClass}
              value={fee}
              onChange={(e) => setFee(e.target.value)}
            />
          </FormField>

          <FormField label="Clinic / Hospital Name">
            <input
              type="text"
              className={inputClass}
              placeholder="e.g. HeartCare Center"
              value={clinic}
              onChange={(e) => setClinic(e.target.value)}
            />
          </FormField>

          <FormField label="Google Maps Link">
            <input
              type="url"
              className={inputClass}
              placeholder="https://maps.google.com/?q=..."
              value={locationUrl}
              onChange={(e) => setLocationUrl(e.target.value)}
            />
          </FormField>
        </div>

        <FormField label="Clinic Physical Address">
          <input
            type="text"
            className={inputClass}
            placeholder="e.g. Suite 402, 120 Healthcare Boulevard, Metro City"
            value={clinicAddress}
            onChange={(e) => setClinicAddress(e.target.value)}
          />
        </FormField>

        <FormField label="Buffer time between appointments (minutes)">
          <input
            type="number"
            min="0"
            max="60"
            step="5"
            className={inputClass}
            value={bufferMins}
            onChange={(e) => setBufferMins(e.target.value)}
          />
          <p className="mt-1 text-xs text-gray-400">
            Added after every slot before the next one becomes available.
          </p>
        </FormField>

        <FormField label="Professional Bio">
          <textarea
            rows={4}
            className={inputClass}
            placeholder="Describe your background, specialties, and care philosophy..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </FormField>

        <div className="flex justify-end pt-2">
          <Button type="submit" loading={update.isPending}>
            Save professional profile
          </Button>
        </div>
      </form>
    </section>
  );
}
