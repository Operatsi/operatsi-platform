import { Metadata } from "next";
import { AppLayout } from "@/components/AppLayout";
import { ComingSoonView } from "@/components/ComingSoonView";
import { ALL_MENU_ITEMS } from "@/lib/navigation";

export const metadata: Metadata = {
  title: "Execution Center | OperatSI Console",
  description: "Real-time task executions, step-by-step verification, and sandbox inspectability.",
};

export default function ExecutionsPage() {
  const item = ALL_MENU_ITEMS["/executions"];
  return (
    <AppLayout activeRoute="/executions">
      <ComingSoonView item={item} />
    </AppLayout>
  );
}
