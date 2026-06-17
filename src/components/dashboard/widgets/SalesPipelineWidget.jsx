import { TrendingUp } from "lucide-react";
import PlaceholderWidget from "./_PlaceholderWidget";

export default function SalesPipelineWidget() {
  return (
    <PlaceholderWidget
      icon={TrendingUp}
      title="Sales pipeline"
      subtitle="Training inquiries by stage"
      phase="Future"
      hint="Pipeline data will populate once the sales / inquiries module exposes status counts."
    />
  );
}
