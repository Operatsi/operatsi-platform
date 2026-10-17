import { Metadata } from "next";
import { AppLayout } from "@/components/AppLayout";
import { ComingSoonView } from "@/components/ComingSoonView";
import { ALL_MENU_ITEMS } from "@/lib/navigation";

export const metadata: Metadata = {
  title: "Team & Departments | OperatSI Console",
  description: "Organization hierarchy, department segregation, and RBAC governance.",
};

export default function TeamPage() {
  const item = ALL_MENU_ITEMS["/team"];
  return (
    <AppLayout activeRoute="/team">
      <ComingSoonView item={item} />
    </AppLayout>
  );
}
