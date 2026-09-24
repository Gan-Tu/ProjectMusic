import { CalendarDaysIcon } from "@heroicons/react/24/outline";

function calendarText(value) {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function calendarDate(value) {
  return new Date(value)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

export function createCalendar(event, origin) {
  const endsAt = new Date(new Date(event.startsAt).getTime() + 3 * 60 * 60 * 1000);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Projct Music//Events//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${event.id}@projctmusic.demo`,
    `DTSTAMP:${calendarDate(event.startsAt)}`,
    `DTSTART:${calendarDate(event.startsAt)}`,
    `DTEND:${calendarDate(endsAt)}`,
    `SUMMARY:${calendarText(event.title)}`,
    `LOCATION:${calendarText(event.address.join(", "))}`,
    `DESCRIPTION:${calendarText("A Projct Music demo event. End time is approximate.")}`,
    `URL:${origin}/events/${event.id}`,
    "END:VEVENT",
    "END:VCALENDAR"
  ];
  return lines.map((line) => line.match(/.{1,70}/g).join("\r\n ")).join("\r\n") + "\r\n";
}

export default function CalendarDownload({ event }) {
  function download() {
    const url = URL.createObjectURL(
      new Blob([createCalendar(event, window.location.origin)], {
        type: "text/calendar;charset=utf-8"
      })
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `${event.id}.ics`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <button
      type="button"
      onClick={download}
      className="flex min-h-10 cursor-pointer items-center gap-2 text-2xs font-bold uppercase tracking-widest hover:text-pmred"
    >
      <CalendarDaysIcon className="h-4 w-4" />
      Add to calendar
    </button>
  );
}
