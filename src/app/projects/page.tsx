import { Metadata } from "next";
import { AppLayout } from "@/components/AppLayout";
import { ComingSoonView } from "@/components/ComingSoonView";
import { ALL_MENU_ITEMS } from "@/lib/navigation";

export const metadata: Metadata = {
  title: "Projects | OperatSI Console",
  description: "Cross-functional project tracking with agile boards and timeline milestones.",
};

export default function ProjectsPage() {
  const item = ALL_MENU_ITEMS["/projects"];
  return (
    <AppLayout activeRoute="/projects">
      <ComingSoonView item={item} />
    </AppLayout>
  );
}
