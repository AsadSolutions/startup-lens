import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TEAM_NAMES } from "@/lib/types";

function TeamCardSkeleton() {
  return (
    <Card>
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-6 w-20 rounded-control" />
      </div>
      <div className="mt-4 flex min-h-[4.5rem] flex-col gap-1.5">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-5/6" />
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <Skeleton className="h-3 w-10" />
        <Skeleton className="h-3 w-14" />
      </div>
    </Card>
  );
}

export function BoardSkeleton() {
  return (
    <>
      <header className="border-b border-border bg-bg px-6 py-4">
        <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between">
          <Skeleton className="h-5 w-64" />
          <Skeleton className="h-5 w-40" />
        </div>
      </header>
      <div className="mx-auto w-full max-w-[1200px] flex-1 px-6 py-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TEAM_NAMES.map((team) => (
            <TeamCardSkeleton key={team} />
          ))}
        </div>
      </div>
    </>
  );
}
