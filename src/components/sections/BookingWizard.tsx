"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./BookingWizard.module.css";
import { DEFAULT_TIMEZONE, toDateKey } from "@/lib/time";

/**
 * The public booking flow: Service → Barber → Extras → Time → Details.
 *
 * The browser never decides anything that matters. Free times come from the
 * server's availability engine, and the final price, length and whether the
 * chair is still free are all recomputed by /api/book when the booking is
 * submitted — so a tampered request cannot buy a cheaper or unavailable slot.
 *
 * The Extras step is skipped entirely when no add-on applies to the chosen
 * service, rather than showing an empty step.
 */

type Service = {
  id: string;
  name: string;
  price: string;
  priceCents: number;
  priceMode: string;
  durationMinutes: number;
  description: string;
  popular: boolean;
  staffIds: string[];
};

type Staff = { id: string; name: string; title: string; imageUrl: string | null; color: string };
type AddOn = { id: string; name: string; priceCents: number; durationMinutes: number; serviceIds: string[] };
type Slot = { startsAt: string; staffId: string; staffName: string; label: string };

export type BookingWizardProps = {
  categories: { title: string; services: Service[] }[];
  staff: Staff[];
  addOns: AddOn[];
  rules: {
    maxAdvanceDays: number;
    currency: string;
    cancellationPolicy: string;
    onlinePayments: boolean;
    salonName: string;
  };
};

const money = (cents: number) => `$${(cents / 100).toFixed(2).replace(/\.00$/, "")}`;

const duration = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m} min`;
  return m ? `${h} hr ${m} min` : `${h} hr`;
};

/**
 * Date key (YYYY-MM-DD) for a day `offset` days from today *in the salon's
 * timezone*. Someone booking from another country still sees the salon's own
 * calendar, so "today" means today in Winnipeg, not wherever they happen to be.
 */
function dayKey(offset: number) {
  return toDateKey(new Date(Date.now() + offset * 86_400_000));
}

/** "Friday, October 9 at 1:00 PM" — always on the salon's clock. */
function whenLabel(startsAt: string) {
  return new Date(startsAt).toLocaleString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: DEFAULT_TIMEZONE,
  });
}

const STEPS = ["Service", "Barber", "Extras", "Time", "Details"] as const;

export default function BookingWizard({ categories, staff, addOns, rules }: BookingWizardProps) {
  const [step, setStep] = useState(0);
  const [service, setService] = useState<Service | null>(null);
  const [staffId, setStaffId] = useState<string>("any");
  const [chosenAddOns, setChosenAddOns] = useState<string[]>([]);
  const [date, setDate] = useState(dayKey(0));
  const [slot, setSlot] = useState<Slot | null>(null);
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);

  // Barbers who can do the chosen service.
  const eligibleStaff = useMemo(
    () => (service ? staff.filter((member) => service.staffIds.includes(member.id)) : []),
    [service, staff],
  );

  // An add-on with no services listed is offered on everything.
  const relevantAddOns = useMemo(
    () =>
      service
        ? addOns.filter((a) => a.serviceIds.length === 0 || a.serviceIds.includes(service.id))
        : [],
    [addOns, service],
  );

  // Extras drops out of the stepper when nothing applies, and the remaining
  // steps are renumbered so the customer sees 1-2-3-4 rather than 1-2-4-5.
  const visibleSteps = useMemo(
    () =>
      STEPS.map((label, index) => ({ label, index })).filter(
        ({ index }) => index !== 2 || relevantAddOns.length > 0,
      ),
    [relevantAddOns.length],
  );

  const days = useMemo(
    () => Array.from({ length: Math.min(rules.maxAdvanceDays, 21) }, (_, i) => dayKey(i)),
    [rules.maxAdvanceDays],
  );

  const totalCents =
    (service?.priceCents ?? 0) +
    relevantAddOns.filter((a) => chosenAddOns.includes(a.id)).reduce((s, a) => s + a.priceCents, 0);

  const totalMinutes =
    (service?.durationMinutes ?? 0) +
    relevantAddOns.filter((a) => chosenAddOns.includes(a.id)).reduce((s, a) => s + a.durationMinutes, 0);

  // Fetch free times whenever the time step's inputs change.
  useEffect(() => {
    if (step !== 3 || !service) return;

    const params = new URLSearchParams({ service: service.id, staff: staffId, date });
    if (chosenAddOns.length) params.set("addons", chosenAddOns.join(","));

    let cancelled = false;
    setLoadingSlots(true);
    setSlots(null);

    fetch(`/api/availability?${params}`)
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled) setSlots(json.slots ?? []);
      })
      .catch(() => {
        if (!cancelled) setSlots([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });

    // A slow answer for a day the customer has already moved on from must not
    // overwrite the times they are looking at now.
    return () => {
      cancelled = true;
    };
  }, [step, service, staffId, date, chosenAddOns]);

  const goTo = (next: number) => {
    setError(null);
    // Extras has nothing to show for this service — step over it either way.
    if (next === 2 && relevantAddOns.length === 0) {
      setStep(step < 2 ? 3 : 1);
      return;
    }
    setStep(next);
  };

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!service || !slot) return;

    const form = new FormData(event.currentTarget);
    setSending(true);
    setError(null);

    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: service.id,
          // "Any barber" resolves to whoever the chosen time belongs to.
          staffId: slot.staffId,
          startsAt: slot.startsAt,
          addOnIds: chosenAddOns,
          name: String(form.get("name") ?? ""),
          email: String(form.get("email") ?? ""),
          phone: String(form.get("phone") ?? ""),
          note: String(form.get("note") ?? ""),
          company: String(form.get("company") ?? ""),
        }),
      });
      const json = await res.json();

      if (!res.ok || !json.ok) {
        setError(json.error ?? "Something went wrong. Please try again.");
        // The slot went while they were typing — send them back to pick again.
        if (res.status === 409) {
          setSlot(null);
          setStep(3);
        }
        return;
      }

      setCode(json.code);
    } catch {
      setError("Couldn't reach the salon. Please check your connection and try again.");
    } finally {
      setSending(false);
    }
  }

  // ---------------------------------------------------------------- done
  if (code) {
    return (
      <div className={styles.done}>
        <h3>Booking confirmed</h3>
        <span className={styles.doneCode}>{code}</span>
        <p>
          {service?.name} with {slot?.staffName}
          <br />
          {slot && whenLabel(slot.startsAt)}
        </p>
        <p className="op-6">{rules.cancellationPolicy}</p>
      </div>
    );
  }

  return (
    <div>
      <ol className={styles.stepper}>
        {visibleSteps.map(({ label, index }, position) => {
          const state = index === step ? "stepActive" : index < step ? "stepDone" : "step";
          return (
            <li key={label}>
              <button
                type="button"
                className={styles[state]}
                onClick={() => index < step && goTo(index)}
                disabled={index >= step}
                aria-current={index === step ? "step" : undefined}
              >
                <span className={styles.stepNumber}>{position + 1}</span>
                {label}
              </button>
            </li>
          );
        })}
      </ol>

      {error ? (
        <p className={styles.message} role="alert">
          {error}
        </p>
      ) : null}

      {/* ------------------------------------------------ 1. service */}
      {step === 0 ? (
        <div>
          {categories.map((category) => (
            <div className={styles.group} key={category.title}>
              <h4 className={styles.groupTitle}>{category.title}</h4>
              <div className={styles.options}>
                {category.services.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    className={service?.id === item.id ? styles.optionSelected : styles.option}
                    onClick={() => {
                      setService(item);
                      setStaffId("any");
                      setChosenAddOns([]);
                      setSlot(null);
                      goTo(1);
                    }}
                    disabled={item.staffIds.length === 0}
                  >
                    <span>
                      <span className={styles.optionName}>
                        {item.name}
                        {item.popular ? <span className={styles.badge}>Popular</span> : null}
                      </span>
                      <span className={styles.optionMeta}>
                        {duration(item.durationMinutes)}
                        {item.staffIds.length === 0 ? " · unavailable" : ""}
                      </span>
                    </span>
                    <span className={styles.optionPrice}>{item.price}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {/* ------------------------------------------------ 2. barber */}
      {step === 1 && service ? (
        <div className={styles.options}>
          <button
            type="button"
            className={staffId === "any" ? styles.optionSelected : styles.option}
            onClick={() => {
              setStaffId("any");
              setSlot(null);
              goTo(2);
            }}
          >
            <span>
              <span className={styles.optionName}>Any barber</span>
              <span className={styles.optionMeta}>Soonest available time</span>
            </span>
          </button>

          {eligibleStaff.map((member) => (
            <button
              type="button"
              key={member.id}
              className={staffId === member.id ? styles.optionSelected : styles.option}
              onClick={() => {
                setStaffId(member.id);
                setSlot(null);
                goTo(2);
              }}
            >
              <span>
                <span className={styles.optionName}>{member.name}</span>
                <span className={styles.optionMeta}>{member.title || "Barber"}</span>
              </span>
            </button>
          ))}
        </div>
      ) : null}

      {/* ------------------------------------------------ 3. extras */}
      {step === 2 && service ? (
        <div>
          <div className={styles.options}>
            {relevantAddOns.map((addOn) => {
              const picked = chosenAddOns.includes(addOn.id);
              return (
                <button
                  type="button"
                  key={addOn.id}
                  className={picked ? styles.optionSelected : styles.option}
                  onClick={() =>
                    setChosenAddOns((current) =>
                      picked ? current.filter((id) => id !== addOn.id) : [...current, addOn.id],
                    )
                  }
                >
                  <span>
                    <span className={styles.optionName}>{addOn.name}</span>
                    <span className={styles.optionMeta}>+{duration(addOn.durationMinutes)}</span>
                  </span>
                  <span className={styles.optionPrice}>+{money(addOn.priceCents)}</span>
                </button>
              );
            })}
          </div>
          <div className={styles.actions}>
            <button type="button" className="btn-main" onClick={() => goTo(3)}>
              Continue
            </button>
            <button type="button" className={styles.back} onClick={() => goTo(1)}>
              Back
            </button>
          </div>
        </div>
      ) : null}

      {/* ------------------------------------------------ 4. time */}
      {step === 3 && service ? (
        <div>
          <div className={styles.days}>
            {days.map((key) => {
              const d = new Date(`${key}T12:00:00`);
              return (
                <button
                  type="button"
                  key={key}
                  className={date === key ? styles.daySelected : styles.day}
                  onClick={() => {
                    setDate(key);
                    setSlot(null);
                  }}
                >
                  <span className={styles.dayName}>
                    {d.toLocaleDateString("en-CA", { weekday: "short" })}
                  </span>
                  <span className={styles.dayNumber}>{d.getDate()}</span>
                  <span className={styles.dayName}>
                    {d.toLocaleDateString("en-CA", { month: "short" })}
                  </span>
                </button>
              );
            })}
          </div>

          {loadingSlots ? (
            <p className={styles.empty}>Looking for free times…</p>
          ) : slots && slots.length > 0 ? (
            <div className={styles.times}>
              {slots.map((item) => (
                <button
                  type="button"
                  key={item.startsAt}
                  className={slot?.startsAt === item.startsAt ? styles.timeSelected : styles.time}
                  onClick={() => {
                    setSlot(item);
                    goTo(4);
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ) : (
            <p className={styles.empty}>
              Nothing free that day{staffId === "any" ? "" : " with this barber"}. Try another date.
            </p>
          )}

          <div className={styles.actions}>
            <button type="button" className={styles.back} onClick={() => goTo(relevantAddOns.length ? 2 : 1)}>
              Back
            </button>
          </div>
        </div>
      ) : null}

      {/* ------------------------------------------------ 5. details */}
      {step === 4 && service && slot ? (
        <form onSubmit={submit}>
          <div className={styles.summary}>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Service</span>
              <span className={styles.summaryValue}>{service.name}</span>
            </div>
            {chosenAddOns.length ? (
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Extras</span>
                <span className={styles.summaryValue}>
                  {relevantAddOns
                    .filter((a) => chosenAddOns.includes(a.id))
                    .map((a) => a.name)
                    .join(", ")}
                </span>
              </div>
            ) : null}
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Barber</span>
              <span className={styles.summaryValue}>{slot.staffName}</span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>When</span>
              <span className={styles.summaryValue}>
                {whenLabel(slot.startsAt)}
              </span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Length</span>
              <span className={styles.summaryValue}>{duration(totalMinutes)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Total</span>
              <span className={`${styles.summaryValue} ${styles.total}`}>
                {service.priceMode === "CONSULTATION"
                  ? "Quoted at your consultation"
                  : service.priceMode === "FROM"
                    ? `From ${money(totalCents)}`
                    : money(totalCents)}
              </span>
            </div>
          </div>

          <div className="row g-3">
            <div className="col-md-6">
              <input className="form-control" name="name" placeholder="Your name" required maxLength={120} />
            </div>
            <div className="col-md-6">
              <input className="form-control" name="phone" placeholder="Phone" required maxLength={30} />
            </div>
            <div className="col-12">
              <input className="form-control" type="email" name="email" placeholder="Email" required />
            </div>
            <div className="col-12">
              <textarea className="form-control h-100px" name="note" placeholder="Anything we should know? (optional)" />
            </div>
          </div>

          {/* Honeypot: hidden from people, tempting to bots. */}
          <input
            type="text"
            name="company"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            style={{ position: "absolute", left: "-9999px", width: 1, height: 1 }}
          />

          <p className="op-6 mt-3" style={{ fontSize: 13 }}>
            {rules.onlinePayments ? "" : "No payment now — pay in the salon. "}
            {rules.cancellationPolicy}
          </p>

          <div className={styles.actions}>
            <button className="btn-main" type="submit" disabled={sending}>
              {sending ? "Booking…" : "Confirm booking"}
            </button>
            <button type="button" className={styles.back} onClick={() => goTo(3)}>
              Back
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
