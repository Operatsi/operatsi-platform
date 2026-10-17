import { Metadata } from "next";
import { AppLayout } from "@/components/AppLayout";
import { ComingSoonView } from "@/components/ComingSoonView";
import { ALL_MENU_ITEMS } from "@/lib/navigation";

export const metadata: Metadata = {
  title: "My Tasks | OperatSI Console",
  description: "Assigned tasks, prioritized action items, and agent delegation backlog.",
};

export default function MyTasksPage() {
  const item = ALL_MENU_ITEMS["/my-tasks"];
  return (
    <AppLayout activeRoute="/my-tasks">
      <ComingSoonView item={item} />
    </AppLayout>
  );
}
