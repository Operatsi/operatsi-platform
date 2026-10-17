import { Metadata } from "next";
import { AppLayout } from "@/components/AppLayout";
import { ComingSoonView } from "@/components/ComingSoonView";
import { ALL_MENU_ITEMS } from "@/lib/navigation";

export const metadata: Metadata = {
  title: "Analytics | OperatSI Console",
  description: "Advanced operational metrics, token usage analytics, and agent productivity ROI.",
};

export default function AnalyticsPage() {
  const item = ALL_MENU_ITEMS["/analytics"];
  return (
    <AppLayout activeRoute="/analytics">
      <ComingSoonView item={item} />
    </AppLayout>
  );
}
