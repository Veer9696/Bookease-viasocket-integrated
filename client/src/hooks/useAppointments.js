import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { appointmentsApi } from "../services/appointmentsApi";
import { useNotifications } from "../context/NotificationContext";

export function useAppointments() {
  return useQuery({ queryKey: ["appointments"], queryFn: appointmentsApi.list });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();
  const { refresh } = useNotifications();
  return useMutation({
    mutationFn: appointmentsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      refresh();
    },
  });
}

export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient();
  const { refresh } = useNotifications();
  return useMutation({
    mutationFn: ({ id, ...payload }) => appointmentsApi.updateStatus(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      refresh();
    },
  });
}

export function useRescheduleAppointment() {
  const queryClient = useQueryClient();
  const { refresh } = useNotifications();
  return useMutation({
    mutationFn: ({ id, ...payload }) => appointmentsApi.reschedule(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      refresh();
    },
  });
}
