import { GraduationCap } from "lucide-react";
import PlaceholderWidget from "./_PlaceholderWidget";

export default function TeacherMyStudentsWidget() {
  return (
    <PlaceholderWidget
      icon={GraduationCap}
      title="My students"
      subtitle="Active enrollments under you"
      phase="Phase 2"
      hint="Once we expose a 'my students' endpoint scoped to the logged-in teacher's batches, this card will populate."
    />
  );
}
