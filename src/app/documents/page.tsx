import { Metadata } from "next";
import { AppLayout } from "@/components/AppLayout";
import { ComingSoonView } from "@/components/ComingSoonView";
import { ALL_MENU_ITEMS } from "@/lib/navigation";

export const metadata: Metadata = {
  title: "Documents | OperatSI Console",
  description: "Centralized knowledge files, shared templates, and secure document vaults.",
};

export default function DocumentsPage() {
  const item = ALL_MENU_ITEMS["/documents"];
  return (
    <AppLayout activeRoute="/documents">
      <ComingSoonView item={item} />
    </AppLayout>
  );
}
