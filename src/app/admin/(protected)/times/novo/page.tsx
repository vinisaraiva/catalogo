import { TeamForm } from "@/components/admin/team-form";

export default function NewTeamPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Novo time</h1>
      <TeamForm />
    </div>
  );
}
