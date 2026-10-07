import { useState } from "react";
import { inputClass } from "./FormField";

export default function PasswordInput({ value, onChange, ...props }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        value={value}
        onChange={onChange}
        className={`${inputClass} pr-16`}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-xs font-medium text-gray-500 hover:text-primary"
      >
        {visible ? "Hide" : "Show"}
      </button>
    </div>
  );
}
