import { AppealStrength } from "../../types/audit";

export default function AppealStrengthCard({ appeal }: { appeal: AppealStrength }) {

  const percent = appeal.percentage;

  return (
    <div className="bg-white p-8 border border-stone rounded-xl">

      <h2 className="text-2xl font-serif mb-6">
        Appeal Strength
      </h2>

      <div className="text-4xl font-bold mb-4">
        {percent}%
      </div>

      <p className="mb-4">
        {appeal.label}
      </p>

      <p className="text-charcoal/70">
        {appeal.reasoning}
      </p>

    </div>
  );
}
