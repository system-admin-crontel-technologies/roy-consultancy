import type { ServiceCategorySummary } from "@roy/types";
import Link from "next/link";
import { Suspense } from "react";
import { apiGet } from "@/lib/api/server";
import { CategoriesTable } from "@/components/admin/catalogue/categories-table";
import { Card } from "@/components/ui/card";
import { PageHeader, TableSkeleton } from "@/components/ui/feedback";

export const metadata = { title: "Service categories" };

export default function CategoriesPage() {
  return (
    <>
      <Link href="/admin/catalogue" className="text-xs text-muted hover:text-foreground">← Service catalogue</Link>
      <div className="mt-3">
        <PageHeader title="Service categories" description="Group services for navigation and reporting. Categories are deactivated, never deleted." />
      </div>
      <Suspense fallback={<Card padded={false}><TableSkeleton /></Card>}>
        <Content />
      </Suspense>
    </>
  );
}

async function Content() {
  const categories = await apiGet<ServiceCategorySummary[]>("/catalogue/categories", { returnTo: "/admin/catalogue/categories" });
  return <CategoriesTable categories={categories} />;
}
