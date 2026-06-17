import { Target } from "lucide-react";
import PlaceholderWidget from "./_PlaceholderWidget";

export default function SalesConversionWidget() {
  return (
    <PlaceholderWidget
      icon={Target}
      title="Conversion rate"
      subtitle="Inquiry → enrolled student"
      phase="Future"
      hint="Once enrollments are linked back to source inquiries, we can compute a real conversion rate here."
    />
  );
}
