"use client";

import { useActionState } from "react";
import SaveButton from "@/components/admin/SaveButton";
import AdminForm from "@/components/admin/AdminForm";
import Tabs from "@/components/admin/Tabs";
import { minutesToLabel, minutesToTimeInput } from "@/lib/time";
import type { ActionResult } from "@/lib/action-result";
import {
  addStaffBreak,
  addStaffDayOff,
  deleteSpecialDate,
  deleteStaff,
  deleteStaffBreak,
  setStaffHours,
  setStaffServices,
  updateStaff,
} from "../actions";
import styles from "../../../admin.module.css";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export type StaffEditorData = {
  staff: {
    id: string;
    name: string;
    title: string;
    email: string;
    phone: string;
    bio: string;
    imageUrl: string;
    color: string;
    commissionPercent: number;
    active: boolean;
  };
  categories: { id: string; name: string; services: { id: string; name: string }[] }[];
  offeredServiceIds: string[];
  hours: { dayOfWeek: number; startMinute: number; endMinute: number }[];
  breaks: { id: string; dayOfWeek: number; startMinute: number; endMinute: number; label: string }[];
  daysOff: { id: string; date: string; type: string; openMinute: number | null; closeMinute: number | null; note: string }[];
  isOwner: boolean;
  canEditAvailability: boolean;
};

const empty: ActionResult = {};

export default function StaffEditor(data: StaffEditorData) {
  const { staff, categories, offeredServiceIds, hours, breaks, daysOff } = data;

  const [detailsState, saveDetails, savingDetails] = useActionState(updateStaff, empty);
  const [servicesState, saveServices, savingServices] = useActionState(setStaffServices, empty);
  const [hoursState, saveHours, savingHours] = useActionState(setStaffHours, empty);
  const [breakState, addBreak, addingBreak] = useActionState(addStaffBreak, empty);
  const [dayOffState, addDayOff, addingDayOff] = useActionState(addStaffDayOff, empty);

  const offered = new Set(offeredServiceIds);
  const hoursByDay = new Map(hours.map((h) => [h.dayOfWeek, h]));

  const details = (
    <section className={styles.panel}>
      {data.isOwner ? (
        <form action={saveDetails}>
          <input type="hidden" name="id" value={staff.id} />

          <div className={styles.fieldRow}>
            <label className={styles.field}>
              <span className={styles.label}>Name</span>
              <input className={styles.input} name="name" defaultValue={staff.name} required />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Role</span>
              <input className={styles.input} name="title" defaultValue={staff.title} />
            </label>
          </div>

          <div className={styles.fieldRow}>
            <label className={styles.field}>
              <span className={styles.label}>Email</span>
              <input className={styles.input} type="email" name="email" defaultValue={staff.email} />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Phone</span>
              <input className={styles.input} name="phone" defaultValue={staff.phone} />
            </label>
          </div>

          <label className={styles.field}>
            <span className={styles.label}>Bio</span>
            <textarea className={styles.input} name="bio" rows={3} defaultValue={staff.bio} />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Photo URL</span>
            <input
              className={styles.input}
              name="imageUrl"
              placeholder="/images/team/1.webp"
              defaultValue={staff.imageUrl}
            />
          </label>

          <div className={styles.fieldRow}>
            <label className={styles.field}>
              <span className={styles.label}>Calendar colour</span>
              <input className={styles.colorInput} type="color" name="color" defaultValue={staff.color} />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Commission %</span>
              <input
                className={styles.input}
                type="number"
                name="commissionPercent"
                min={0}
                max={100}
                defaultValue={staff.commissionPercent}
              />
            </label>
          </div>

          <label className={styles.checkbox}>
            <input type="checkbox" name="active" defaultChecked={staff.active} />
            <span>Bookable — shown on the website</span>
          </label>

          <SaveButton state={detailsState} pending={savingDetails}>
            Save details
          </SaveButton>
        </form>
      ) : (
        <p className={styles.subtitle}>Only the owner can change these.</p>
      )}
    </section>
  );

  const services = (
    <section className={styles.panel}>
      {data.isOwner ? (
        <form action={saveServices}>
          <input type="hidden" name="id" value={staff.id} />
          <div className={styles.checkColumns}>
            {categories.map((category) => (
              <fieldset key={category.id} className={styles.fieldset}>
                <legend className={styles.legend}>{category.name}</legend>
                {category.services.map((service) => (
                  <label key={service.id} className={styles.checkbox}>
                    <input
                      type="checkbox"
                      name="serviceIds"
                      value={service.id}
                      defaultChecked={offered.has(service.id)}
                    />
                    <span>{service.name}</span>
                  </label>
                ))}
              </fieldset>
            ))}
          </div>
          <SaveButton state={servicesState} pending={savingServices}>
            Save services
          </SaveButton>
        </form>
      ) : (
        <p className={styles.subtitle}>
          {offeredServiceIds.length} services. Only the owner can change these.
        </p>
      )}
    </section>
  );

  const workingHours = (
    <section className={styles.panel}>
      <p className={styles.panelNote}>
        Unticked days are days off. These sit inside the salon&rsquo;s own opening hours.
      </p>
      <form action={saveHours}>
        <input type="hidden" name="id" value={staff.id} />
        <table className={styles.table}>
          <tbody>
            {DAYS.map((label, day) => {
              const row = hoursByDay.get(day);
              return (
                <tr key={day}>
                  <td>
                    <label className={styles.checkbox}>
                      <input
                        type="checkbox"
                        name={`working-${day}`}
                        defaultChecked={Boolean(row)}
                        disabled={!data.canEditAvailability}
                      />
                      <span>{label}</span>
                    </label>
                  </td>
                  <td>
                    <input
                      className={styles.timeInput}
                      type="time"
                      name={`start-${day}`}
                      defaultValue={minutesToTimeInput(row?.startMinute ?? 600)}
                      disabled={!data.canEditAvailability}
                    />
                  </td>
                  <td>
                    <input
                      className={styles.timeInput}
                      type="time"
                      name={`end-${day}`}
                      defaultValue={minutesToTimeInput(row?.endMinute ?? 1200)}
                      disabled={!data.canEditAvailability}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {data.canEditAvailability ? (
          <SaveButton state={hoursState} pending={savingHours}>
            Save hours
          </SaveButton>
        ) : null}
      </form>
    </section>
  );

  const breaksPanel = (
    <section className={styles.panel}>
      <p className={styles.panelNote}>Repeats every week. Customers cannot book over these.</p>

      {breaks.length ? (
        <ul className={styles.rows}>
          {breaks.map((item) => (
            <li key={item.id}>
              <span>
                {DAYS[item.dayOfWeek]} · {minutesToLabel(item.startMinute)} –{" "}
                {minutesToLabel(item.endMinute)} · {item.label}
              </span>
              {data.canEditAvailability ? (
                <AdminForm action={deleteStaffBreak} variant="link" submitLabel="Remove">
                  <input type="hidden" name="breakId" value={item.id} />
                </AdminForm>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.subtitle}>No breaks set.</p>
      )}

      {data.canEditAvailability ? (
        <form action={addBreak} className={styles.inlineForm}>
          <input type="hidden" name="id" value={staff.id} />
          <label className={styles.field}>
            <span className={styles.label}>Day</span>
            <select className={styles.select} name="dayOfWeek" defaultValue="1">
              {DAYS.map((label, day) => (
                <option key={day} value={day}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span className={styles.label}>From</span>
            <input className={styles.timeInput} type="time" name="start" defaultValue="13:00" required />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>To</span>
            <input className={styles.timeInput} type="time" name="end" defaultValue="13:30" required />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Label</span>
            <input className={styles.input} name="label" placeholder="Lunch" />
          </label>
          <SaveButton state={breakState} pending={addingBreak} variant="ghost">
            Add break
          </SaveButton>
        </form>
      ) : null}
    </section>
  );

  const daysOffPanel = (
    <section className={styles.panel}>
      {daysOff.length ? (
        <ul className={styles.rows}>
          {daysOff.map((item) => (
            <li key={item.id}>
              <span>
                {item.date} ·{" "}
                {item.type === "CLOSED"
                  ? "Off"
                  : `${minutesToLabel(item.openMinute ?? 0)} – ${minutesToLabel(item.closeMinute ?? 0)}`}
                {item.note ? ` · ${item.note}` : ""}
              </span>
              {data.canEditAvailability ? (
                <AdminForm action={deleteSpecialDate} variant="link" submitLabel="Remove">
                  <input type="hidden" name="specialDateId" value={item.id} />
                </AdminForm>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.subtitle}>Nothing booked off.</p>
      )}

      {data.canEditAvailability ? (
        <form action={addDayOff} className={styles.inlineForm}>
          <input type="hidden" name="id" value={staff.id} />
          <label className={styles.field}>
            <span className={styles.label}>Date</span>
            <input className={styles.input} type="date" name="date" required />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Type</span>
            <select className={styles.select} name="mode" defaultValue="off">
              <option value="off">Day off</option>
              <option value="custom">Different hours</option>
            </select>
          </label>
          <label className={styles.field}>
            <span className={styles.label}>From</span>
            <input className={styles.timeInput} type="time" name="open" defaultValue="10:00" />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>To</span>
            <input className={styles.timeInput} type="time" name="close" defaultValue="16:00" />
          </label>
          <SaveButton state={dayOffState} pending={addingDayOff} variant="ghost">
            Add
          </SaveButton>
        </form>
      ) : null}
    </section>
  );

  const removePanel = (
    <section className={styles.panel}>
      <p className={styles.panelNote}>
        A barber with past bookings is hidden rather than deleted, so their history stays intact.
      </p>
      <AdminForm
        action={deleteStaff}
        variant="danger"
        submitLabel={`Remove ${staff.name}`}
        pendingLabel="Removing…"
        confirm={`Remove ${staff.name}?`}
      >
        <input type="hidden" name="id" value={staff.id} />
      </AdminForm>
    </section>
  );

  const tabs = [
    { id: "details", label: "Details", content: details },
    { id: "services", label: "Services offered", content: services },
    { id: "hours", label: "Working hours", content: workingHours },
    { id: "breaks", label: "Breaks", content: breaksPanel },
    { id: "daysoff", label: "Days off", content: daysOffPanel },
    ...(data.isOwner ? [{ id: "remove", label: "Remove", content: removePanel }] : []),
  ];

  return <Tabs items={tabs} label={`Editing ${staff.name}`} />;
}
