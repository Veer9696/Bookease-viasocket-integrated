import { useLabTestCatalog } from "../hooks/useLabTests";
import LabTestCard from "../components/labs/LabTestCard";
import CartDrawer from "../components/labs/CartDrawer";
import Spinner from "../components/common/Spinner";
import ErrorBanner from "../components/common/ErrorBanner";

export default function LabTestsPage() {
  const { data: tests, isLoading, error } = useLabTestCatalog();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 pb-40">
      <h1 className="text-2xl font-bold text-gray-900">Book a lab test</h1>
      <p className="mt-1 text-gray-500">Add one or more tests, then pick a collection time to check out.</p>

      <div className="mt-6 space-y-3">
        {isLoading && <Spinner />}
        <ErrorBanner message={error?.message} />
        {tests?.map((t) => <LabTestCard key={t.id} test={t} />)}
      </div>

      <CartDrawer />
    </div>
  );
}
