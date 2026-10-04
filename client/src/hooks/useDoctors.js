import { useQuery } from "@tanstack/react-query";
import { doctorsApi } from "../services/doctorsApi";

export function useDoctors(specialty) {
  return useQuery({
    queryKey: ["doctors", specialty || "all"],
    queryFn: () => doctorsApi.list(specialty),
  });
}

export function useDoctor(id) {
  return useQuery({
    queryKey: ["doctor", id],
    queryFn: () => doctorsApi.getById(id),
    enabled: !!id,
  });
}

export function useDoctorSlots(id, date) {
  return useQuery({
    queryKey: ["doctor-slots", id, date?.toDateString()],
    queryFn: () => doctorsApi.getSlots(id, date),
    enabled: !!id && !!date,
  });
}
