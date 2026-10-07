import { redirect } from "next/navigation";

/** /admin has no page of its own; the calendar is the landing screen. */
export default function AdminIndex() {
  redirect("/admin/bookings");
}
