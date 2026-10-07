import Link from "next/link";
import { setAppointmentStatus, saveStaffNote } from "@/app/admin/(panel)/bookings/actions";
import CouponOnBooking from "./CouponOnBooking";
import PaymentPanel from "./PaymentPanel";
import { getAppointment } from "@/lib/bookings";
import { balanceOf } from "@/lib/payment-labels";
import { formatAppointment, durationLabel } from "@/lib/time";
import { formatMoney } from "@/lib/money";
import styles from "@/app/admin/admin.module.css";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Awaiting payment",
  CONFIRMED: "Confirmed",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
  NO_SHOW: "No-show",
};

const PAYMENT_LABEL: Record<string, string> = {
  NOT_REQUIRED: "No payment needed",
  PENDING: "Not paid",
  PAID: "Paid in full",
  DEPOSIT_PAID: "Deposit paid",
  REFUNDED: "Refunded",
  FAILED: "Payment failed",
};

/** The side panel shown when an appointment is opened from the calendar. */
export default async function BookingDetail({
  id,
  backHref,
  canEdit,
  isOwner = false,
}: {
  id: string;
  backHref: string;
  canEdit: boolean;
  isOwner?: boolean;
}) {
  const appointment = await getAppointment(id);
  if (!appointment) return null;

  const balance = balanceOf(appointment);

  return (
    <aside className={styles.detail} aria-label="Appointment details">
      <div className={styles.detailHead}>
        <div>
          <h2 className={styles.detailName}>{appointment.customer.name}</h2>
          <p className={styles.detailCode}>{appointment.code}</p>
        </div>
        <Link href={backHref} className={styles.buttonGhost} scroll={false}>
          Close
        </Link>
      </div>

      <div className={styles.detailActions}>
        <Link href={`/admin/bookings/${id}/edit`} className={styles.buttonGhost}>
          Reschedule or change
        </Link>
      </div>

      <dl className={styles.detailList}>
        <dt>When</dt>
        <dd>{formatAppointment(appointment.startsAt)}</dd>

        <dt>Service</dt>
        <dd>
          {appointment.service.name}
          {appointment.addOns.length
            ? ` + ${appointment.addOns.map((a) => a.addOn.name).join(", ")}`
            : ""}
        </dd>

        <dt>Length</dt>
        <dd>
          {durationLabel(
            Math.round((+appointment.endsAt - +appointment.startsAt) / 60000),
          )}
        </dd>

        <dt>Barber</dt>
        <dd>
          <span
            className={styles.swatch}
            style={{ background: appointment.staff.color }}
            aria-hidden="true"
          />
          {appointment.staff.name}
        </dd>

        <dt>Status</dt>
        <dd>{STATUS_LABEL[appointment.status] ?? appointment.status}</dd>

        <dt>Payment</dt>
        <dd>
          {PAYMENT_LABEL[appointment.paymentStatus] ?? appointment.paymentStatus}
          {appointment.priceCents > 0 ? ` · ${formatMoney(appointment.priceCents)}` : ""}
          {balance > 0 && appointment.paidCents > 0
            ? ` (${formatMoney(balance)} due in salon)`
            : ""}
        </dd>

        <dt>Contact</dt>
        <dd>
          <a href={`mailto:${appointment.customer.email}`}>{appointment.customer.email}</a>
          <br />
          <a href={`tel:${appointment.customer.phone.replace(/[^\d+]/g, "")}`}>
            {appointment.customer.phone}
          </a>
        </dd>

        {appointment.customerNote ? (
          <>
            <dt>Their note</dt>
            <dd>{appointment.customerNote}</dd>
          </>
        ) : null}
      </dl>

      {canEdit ? (
        <>
          <div className={styles.detailActions}>
            {appointment.status !== "CONFIRMED" ? (
              <form action={setAppointmentStatus}>
                <input type="hidden" name="id" value={appointment.id} />
                <input type="hidden" name="status" value="CONFIRMED" />
                <button className={styles.button} type="submit">
                  Confirm
                </button>
              </form>
            ) : null}

            <form action={setAppointmentStatus}>
              <input type="hidden" name="id" value={appointment.id} />
              <input type="hidden" name="status" value="COMPLETED" />
              <button className={styles.buttonGhost} type="submit">
                Completed
              </button>
            </form>

            <form action={setAppointmentStatus}>
              <input type="hidden" name="id" value={appointment.id} />
              <input type="hidden" name="status" value="NO_SHOW" />
              <button className={styles.buttonGhost} type="submit">
                No-show
              </button>
            </form>

            <form action={setAppointmentStatus}>
              <input type="hidden" name="id" value={appointment.id} />
              <input type="hidden" name="status" value="CANCELLED" />
              <button className={styles.buttonGhost} type="submit">
                Cancel
              </button>
            </form>
          </div>

          <CouponOnBooking
            appointmentId={appointment.id}
            appliedCode={appointment.coupon?.code ?? null}
            discountCents={appointment.discountCents}
          />

          <PaymentPanel
            appointmentId={appointment.id}
            balanceCents={balance}
            canRefund={isOwner}
            payments={appointment.payments.map((payment) => ({
              id: payment.id,
              amountCents: payment.amountCents,
              refundedCents: payment.refundedCents,
              method: payment.method,
              status: payment.status,
              takenBy: payment.takenBy?.name ?? null,
              createdAt: payment.createdAt.toISOString(),
            }))}
          />

          <form action={saveStaffNote} className={styles.noteForm}>
            <input type="hidden" name="id" value={appointment.id} />
            <label className={styles.label} htmlFor="staffNote">
              Private note
            </label>
            <textarea
              id="staffNote"
              name="staffNote"
              className={styles.input}
              rows={3}
              defaultValue={appointment.staffNote}
            />
            <button className={styles.buttonGhost} type="submit">
              Save note
            </button>
          </form>
        </>
      ) : (
        <p className={styles.subtitle}>This appointment belongs to another barber.</p>
      )}
    </aside>
  );
}
