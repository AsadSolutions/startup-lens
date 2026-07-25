import { Skeleton } from "@/components/ui/skeleton";

export function TraceSkeleton() {
  return (
    <>
      <header className="border-b border-border bg-bg px-6 py-6 font-mono">
        <div className="mx-auto flex w-full max-w-[780px] gap-x-8">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </header>
      <div className="mx-auto grid w-full max-w-[780px] flex-1 grid-cols-[1.25rem_1fr] gap-x-4 px-6 py-10 font-mono">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="contents">
            <Skeleton className="mt-1.5 h-2.5 w-2.5 rounded-full" />
            <Skeleton className={i < 3 ? "mb-8 h-5 w-2/3" : "h-5 w-2/3"} />
          </div>
        ))}
      </div>
    </>
  );
}
