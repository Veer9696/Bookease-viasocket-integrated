const VARIANTS = {
  primary: "bg-primary text-white hover:bg-primary-dark",
  secondary: "bg-white text-primary border border-primary hover:bg-primary-light",
  danger: "bg-danger text-white hover:opacity-90",
  ghost: "bg-transparent text-gray-700 hover:bg-gray-100",
};

export default function Button({ variant = "primary", className = "", disabled, loading, children, ...props }) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
      {children}
    </button>
  );
}
