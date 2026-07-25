import { Skeleton } from "@/components/ui/skeleton";

export function ReportSkeleton() {
  return (
    <>
      <header className="border-b border-border bg-bg px-6 py-6">
        <div className="mx-auto flex w-full max-w-[780px] flex-col gap-3">
          <div className="flex items-start justify-between gap-4">
            <Skeleton className="h-6 w-32 rounded-full" />
            <Skeleton className="h-8 w-36" />
          </div>
          <Skeleton className="h-7 w-3/4" />
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[780px] flex-1 flex-col gap-10 px-6 py-10">
        <section className="flex flex-col gap-3">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </section>

        {[0, 1].map((i) => (
          <section key={i} className="flex flex-col gap-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </section>
        ))}
      </div>
    </>
  );
}
