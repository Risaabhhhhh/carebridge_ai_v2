export default function StrengthWeaknessSection({
  strong,
  weak,
  steps,
}: {
  strong: string[];
  weak: string[];
  steps: string[];
}) {
  return (
    <div className="grid md:grid-cols-3 gap-8">

      <div className="bg-white p-6 border border-green-200 rounded-lg">
        <h3 className="font-serif text-green-600 mb-4">Strong Points</h3>
        {strong.map((s, i) => (
          <p key={i} className="text-sm mb-2">{s}</p>
        ))}
      </div>

      <div className="bg-white p-6 border border-red-200 rounded-lg">
        <h3 className="font-serif text-red-600 mb-4">Weak Points</h3>
        {weak.map((w, i) => (
          <p key={i} className="text-sm mb-2">{w}</p>
        ))}
      </div>

      <div className="bg-white p-6 border border-stone rounded-lg">
        <h3 className="font-serif mb-4">Next Steps</h3>
        {steps.map((step, i) => (
          <p key={i} className="text-sm mb-2">{step}</p>
        ))}
      </div>

    </div>
  );
}
