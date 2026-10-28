import { Suspense, type ReactNode } from "react";
import { Sidebar } from "@/components/admin/sidebar";
import { UserMenu } from "@/components/admin/user-menu";
import { Skeleton } from "@/components/ui/feedback";

export default function AdminAppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Suspense fallback={<aside className="hidden w-60 shrink-0 border-r border-border bg-card md:block" />}>
        <Sidebar />
      </Suspense>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4 md:px-8">
          <p className="text-sm font-medium text-muted md:hidden">Roy Consultancy Admin</p>
          <div className="ml-auto">
            <Suspense fallback={<Skeleton className="h-8 w-44" />}>
              <UserMenu />
            </Suspense>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
