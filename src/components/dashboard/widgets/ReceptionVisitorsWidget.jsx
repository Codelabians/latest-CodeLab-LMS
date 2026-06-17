import { DoorOpen } from "lucide-react";
import PlaceholderWidget from "./_PlaceholderWidget";

export default function ReceptionVisitorsWidget() {
  return (
    <PlaceholderWidget
      icon={DoorOpen}
      title="Walk-in visitors today"
      subtitle="Who came in and what they wanted"
      phase="Future"
      hint="Visitor logs will move into this card once we ship the reception front-desk module."
    />
  );
}
