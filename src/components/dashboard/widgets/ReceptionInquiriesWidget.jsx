import { Inbox } from "lucide-react";
import PlaceholderWidget from "./_PlaceholderWidget";

export default function ReceptionInquiriesWidget() {
  return (
    <PlaceholderWidget
      icon={Inbox}
      title="Training inquiries"
      subtitle="Pending course / batch inquiries"
      phase="Future"
      hint="Once the inquiries module is wired into a `/inquiries` endpoint, this will list the most recent leads."
    />
  );
}
