"use client";

interface Props {
  redFlags: string[];
  positiveFlags: string[];
}

export default function PolicyFlagsSection({
  redFlags,
  positiveFlags,
}: Props) {
  return (
    <div className="mt-16 grid md:grid-cols-2 gap-10 animate-fadeUp">

      {/* RED FLAGS */}
      <div className="bg-white border border-red-200 rounded-xl p-8 shadow-sm">
        <h3 className="text-xl font-serif text-red-600 mb-6">
          Key Risk Indicators
        </h3>

        {redFlags.length === 0 ? (
          <p className="text-charcoal/60 text-sm">
            No major structural risks detected.
          </p>
        ) : (
          <ul className="space-y-4">
            {redFlags.map((flag, index) => (
              <li
                key={index}
                className="text-sm text-charcoal/80 leading-relaxed border-l-2 border-red-400 pl-4"
              >
                {flag}
              </li>
            ))}
          </ul>
        )}
      </div>


      {/* POSITIVE FLAGS */}
      <div className="bg-white border border-green-200 rounded-xl p-8 shadow-sm">
        <h3 className="text-xl font-serif text-green-600 mb-6">
          Strength Indicators
        </h3>

        {positiveFlags.length === 0 ? (
          <p className="text-charcoal/60 text-sm">
            No notable structural strengths identified.
          </p>
        ) : (
          <ul className="space-y-4">
            {positiveFlags.map((flag, index) => (
              <li
                key={index}
                className="text-sm text-charcoal/80 leading-relaxed border-l-2 border-green-400 pl-4"
              >
                {flag}
              </li>
            ))}
          </ul>
        )}
      </div>

    </div>
  );
}
