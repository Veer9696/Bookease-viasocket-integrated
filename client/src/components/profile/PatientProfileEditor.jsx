import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { profileApi } from "../../services/profileApi";
import { useAuth } from "../../context/AuthContext";
import Button from "../common/Button";
import FormField, { inputClass } from "../common/FormField";
import ErrorBanner from "../common/ErrorBanner";
import Spinner from "../common/Spinner";
import { useToast } from "../common/Toast";

export default function PatientProfileEditor() {
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ["patient-profile"],
    queryFn: profileApi.getProfile,
  });

  const { data: addresses, isLoading: addressesLoading } = useQuery({
    queryKey: ["saved-addresses"],
    queryFn: profileApi.getAddresses,
  });

  // Personal details state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [profileError, setProfileError] = useState(null);

  // Address form state
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressLabel, setAddressLabel] = useState("Home");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [addressError, setAddressError] = useState(null);

  useEffect(() => {
    const u = profileData?.user || user;
    if (u) {
      setName(u.name || "");
      setPhone(u.phone || "");
      setDob(u.dob ? new Date(u.dob).toISOString().slice(0, 10) : "");
      setGender(u.gender || "");
      setBloodGroup(u.bloodGroup || "");
      setEmergencyContact(u.emergencyContact || "");
    }
  }, [profileData, user]);

  const updateProfileMutation = useMutation({
    mutationFn: profileApi.updateProfile,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["patient-profile"] });
      if (updateUser && data.user) updateUser(data.user);
      showToast("Personal details updated successfully", "success");
      setProfileError(null);
    },
    onError: (err) => setProfileError(err.message),
  });

  const addAddressMutation = useMutation({
    mutationFn: profileApi.createAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-addresses"] });
      queryClient.invalidateQueries({ queryKey: ["patient-profile"] });
      showToast("Address saved successfully", "success");
      setShowAddressForm(false);
      resetAddressForm();
    },
    onError: (err) => setAddressError(err.message),
  });

  const setDefaultMutation = useMutation({
    mutationFn: profileApi.setDefaultAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-addresses"] });
      showToast("Default address updated", "success");
    },
  });

  const deleteAddressMutation = useMutation({
    mutationFn: profileApi.deleteAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-addresses"] });
      showToast("Address removed", "success");
    },
  });

  function resetAddressForm() {
    setAddressLabel("Home");
    setStreet("");
    setCity("");
    setState("");
    setPincode("");
    setIsDefault(false);
    setAddressError(null);
  }

  function handleSaveProfile(e) {
    e.preventDefault();
    setProfileError(null);
    updateProfileMutation.mutate({
      name,
      phone,
      dob: dob || "",
      gender,
      bloodGroup,
      emergencyContact,
    });
  }

  function handleAddAddress(e) {
    e.preventDefault();
    if (!street.trim() || !city.trim() || !pincode.trim()) {
      setAddressError("Street, city, and pincode are required");
      return;
    }
    addAddressMutation.mutate({
      label: addressLabel,
      street,
      city,
      state,
      pincode,
      isDefault,
    });
  }

  if (profileLoading) return <Spinner />;

  return (
    <div className="space-y-8">
      {/* Personal Details Section */}
      <section className="rounded-card border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">Personal Information</h2>
        <p className="mt-1 text-sm text-gray-500">
          Manage your personal details for appointments and lab orders.
        </p>

        <form onSubmit={handleSaveProfile} className="mt-6 space-y-4">
          <ErrorBanner message={profileError} />

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
                placeholder="+1 555-0199"
                className={inputClass}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </FormField>

            <FormField label="Date of Birth">
              <input
                type="date"
                className={inputClass}
                value={dob}
                onChange={(e) => setDob(e.target.value)}
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

            <FormField label="Blood Group">
              <select
                className={inputClass}
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
              >
                <option value="">Select blood group</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </FormField>

            <FormField label="Emergency Contact (Name & Phone)">
              <input
                type="text"
                placeholder="e.g. Jane Doe (555-0144)"
                className={inputClass}
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
              />
            </FormField>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" loading={updateProfileMutation.isPending}>
              Save personal details
            </Button>
          </div>
        </form>
      </section>

      {/* Saved Addresses Section */}
      <section className="rounded-card border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Saved Addresses</h2>
            <p className="mt-1 text-sm text-gray-500">
              Addresses used for home sample collection during lab test bookings.
            </p>
          </div>
          {!showAddressForm && (
            <Button
              variant="secondary"
              onClick={() => {
                resetAddressForm();
                setShowAddressForm(true);
              }}
            >
              + Add new address
            </Button>
          )}
        </div>

        {/* New Address Form */}
        {showAddressForm && (
          <form
            onSubmit={handleAddAddress}
            className="mt-6 rounded-xl border border-primary/20 bg-primary-light/20 p-5 space-y-4"
          >
            <h3 className="font-semibold text-gray-900">Add home collection address</h3>
            <ErrorBanner message={addressError} />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Address Label">
                <select
                  className={inputClass}
                  value={addressLabel}
                  onChange={(e) => setAddressLabel(e.target.value)}
                >
                  <option value="Home">Home</option>
                  <option value="Work">Work</option>
                  <option value="Parents">Parents</option>
                  <option value="Other">Other</option>
                </select>
              </FormField>

              <FormField label="Postal Code / PIN">
                <input
                  type="text"
                  placeholder="e.g. 10001"
                  className={inputClass}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  required
                />
              </FormField>
            </div>

            <FormField label="Street Address">
              <input
                type="text"
                placeholder="Apt, Suite, Building, Street line"
                className={inputClass}
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                required
              />
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="City">
                <input
                  type="text"
                  placeholder="City"
                  className={inputClass}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                />
              </FormField>

              <FormField label="State / Province">
                <input
                  type="text"
                  placeholder="State"
                  className={inputClass}
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                />
              </FormField>
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span>Set as default address for lab pickups</span>
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowAddressForm(false)}
              >
                Cancel
              </Button>
              <Button type="submit" loading={addAddressMutation.isPending}>
                Save address
              </Button>
            </div>
          </form>
        )}

        {/* Existing Addresses List */}
        <div className="mt-6 space-y-3">
          {addressesLoading && <Spinner />}
          {!addressesLoading && (!addresses || addresses.length === 0) && !showAddressForm && (
            <p className="py-4 text-center text-sm text-gray-500">
              No saved addresses yet. Add one to easily select it during lab test checkout.
            </p>
          )}

          {addresses?.map((addr) => (
            <div
              key={addr.id}
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border p-4 transition ${
                addr.isDefault
                  ? "border-primary bg-primary-light/10"
                  : "border-gray-200 bg-white"
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">{addr.label}</span>
                  {addr.isDefault && (
                    <span className="rounded-full bg-primary-light px-2.5 py-0.5 text-xs font-semibold text-primary">
                      Default
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-700">
                  {addr.street}, {addr.city}
                  {addr.state ? `, ${addr.state}` : ""} - {addr.pincode}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {!addr.isDefault && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDefaultMutation.mutate(addr.id)}
                    loading={setDefaultMutation.isPending}
                  >
                    Set default
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => deleteAddressMutation.mutate(addr.id)}
                  loading={deleteAddressMutation.isPending}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
