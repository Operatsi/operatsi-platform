import { Metadata } from "next";
import { AppLayout } from "@/components/AppLayout";
import { ComingSoonView } from "@/components/ComingSoonView";
import { ALL_MENU_ITEMS } from "@/lib/navigation";

export const metadata: Metadata = {
  title: "Workflows | OperatSI Console",
  description: "Deterministic DAG pipelines, event-driven triggers, and failure fallback logic.",
};

export default function WorkflowsPage() {
  const item = ALL_MENU_ITEMS["/workflows"];
  return (
    <AppLayout activeRoute="/workflows">
      <ComingSoonView item={item} />
    </AppLayout>
  );
}
