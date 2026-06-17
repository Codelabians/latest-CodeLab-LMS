import { CalendarDays } from "lucide-react";
import PlaceholderWidget from "./_PlaceholderWidget";

export default function TeacherTodaysClassesWidget() {
  return (
    <PlaceholderWidget
      icon={CalendarDays}
      title="Today's classes"
      subtitle="Your schedule for the day"
      phase="Phase 2 — Attendance"
      hint="Today's classes will list here once the attendance module lands and we wire the class schedule into a /me/classes endpoint."
    />
  );
}
