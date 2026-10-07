import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "../../services/analyticsApi";
import Spinner from "../common/Spinner";
import ErrorBanner from "../common/ErrorBanner";

const CARDS = [
  { key: "total", label: "Total", tone: "text-gray-900" },
  { key: "pending", label: "Pending", tone: "text-warning" },
  { key: "completed", label: "Completed", tone: "text-success" },
  { key: "cancelled", label: "Cancelled", tone: "text-gray-500" },
];

export default function AnalyticsSummary() {
  const [range, setRange] = useState("week");
  const { data, isLoading, error } = useQuery({
    queryKey: ["analytics", range],
    queryFn: () => analyticsApi.summary(range),
  });

  const maxDaily = Math.max(1, ...(data?.daily || []).map((d) => d.count));

  return (
    <section className="rounded-card border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Clinic analytics</h2>
        <div className="flex rounded-full bg-gray-100 p-1 text-sm">
          {["week", "month"].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-full px-3 py-1 capitalize ${range === r ? "bg-white font-medium text-primary shadow-sm" : "text-gray-500"}`}
            >
              This {r}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <Spinner label="Loading analytics..." />}
      <ErrorBanner message={error?.message} />

      {data && (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {CARDS.map((c) => (
              <div key={c.key} className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs text-gray-500">{c.label}</p>
                <p className={`text-2xl font-bold ${c.tone}`}>{data.counts[c.key]}</p>
              </div>
            ))}
            <div className="col-span-2 rounded-lg bg-primary-light p-3 sm:col-span-1">
              <p className="text-xs text-primary">Revenue (completed)</p>
              <p className="text-2xl font-bold text-primary">${data.revenue}</p>
            </div>
          </div>

          <div className="mt-5">
            <p className="text-xs font-medium text-gray-500">Appointments per day</p>
            <div className="mt-2 flex h-28 items-end gap-1" aria-label="Appointments per day">
              {data.daily.map((d) => (
                <div key={d.date} className="group flex flex-1 flex-col items-center justify-end" title={`${d.date}: ${d.count}`}>
                  <span className="mb-1 text-[10px] text-gray-500 opacity-0 group-hover:opacity-100">{d.count}</span>
                  <div
                    className="w-full rounded-t bg-primary/80"
                    style={{ height: `${(d.count / maxDaily) * 100}%`, minHeight: d.count ? 4 : 1 }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-gray-400">
              <span>{new Date(data.from).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
              <span>{new Date(new Date(data.to) - 1).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
