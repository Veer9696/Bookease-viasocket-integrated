import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { labApi } from "../services/labApi";
import { useNotifications } from "../context/NotificationContext";

export function useLabTestCatalog() {
  return useQuery({ queryKey: ["lab-tests"], queryFn: labApi.listTests });
}

export function useLabBookings() {
  return useQuery({ queryKey: ["lab-bookings"], queryFn: labApi.list });
}

export function useCreateLabBooking() {
  const queryClient = useQueryClient();
  const { refresh } = useNotifications();
  return useMutation({
    mutationFn: labApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lab-bookings"] });
      refresh();
    },
  });
}
