import Link from "next/link";
import type { TeamRow } from "@/lib/queries/teams";

/**
 * "Crest medallion" treatment: a circular badge frame (like a team crest
 * patch) instead of a plain rectangular photo card — reads immediately as
 * "team", which a generic bordered rectangle doesn't.
 */
export function TeamCard({ team }: { team: Pick<TeamRow, "slug" | "name" | "logo_url"> }) {
  return (
    <Link
      href={`/time/${team.slug}`}
      className="group flex w-20 shrink-0 snap-start flex-col items-center gap-2 text-center"
    >
      <span className="ring-border group-hover:ring-primary bg-card flex h-16 w-16 items-center justify-center rounded-full p-2 ring-2 transition-all duration-200 group-hover:shadow-md group-hover:shadow-primary/20">
        {team.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- arbitrary admin-entered URL, not a known image host
          <img src={team.logo_url} alt="" loading="lazy" className="h-full w-full object-contain" />
        ) : (
          <span className="bg-muted h-full w-full rounded-full" aria-hidden="true" />
        )}
      </span>
      <span className="line-clamp-2 text-xs font-medium">{team.name}</span>
    </Link>
  );
}
