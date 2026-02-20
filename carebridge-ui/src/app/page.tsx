"use client";

import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-ivory text-charcoal font-sans">

      {/* HERO */}
      <section className="px-6 pt-36 pb-32 text-center">
        <div className="max-w-4xl mx-auto animate-fadeUp">

          <h1 className="text-4xl md:text-6xl font-serif font-semibold leading-tight">
            Intelligent Insurance Analysis.
            <br />
            Structured Financial Clarity.
          </h1>

          <p className="mt-8 text-lg md:text-xl text-sage max-w-2xl mx-auto leading-relaxed">
            CareBridge AI provides regulatory-grade health insurance intelligence —
            identifying structural risks, compliance gaps, and transparency weaknesses
            before financial commitment.
          </p>

          <div className="mt-12 flex flex-col sm:flex-row justify-center gap-6">
            <Link
              href="/prepurchase"
              className="px-8 py-4 bg-sage text-white rounded-md font-medium tracking-wide hover:opacity-90 transition"
            >
              Analyze Policy
            </Link>

            <Link
              href="/audit"
              className="px-8 py-4 border border-sage text-sage rounded-md hover:bg-sage hover:text-white transition"
            >
              Analyze Rejection
            </Link>
          </div>

        </div>
      </section>


      {/* SUBTLE DIVIDER */}
      <div className="h-px bg-stone/50 w-full" />


      {/* FEATURES */}
      <section className="px-6 py-32">
        <div className="max-w-6xl mx-auto">

          <h2 className="text-3xl font-serif text-center mb-20">
            Core Intelligence Modules
          </h2>

          <div className="grid md:grid-cols-3 gap-12">

            {[
              {
                title: "Policy Risk Classification",
                desc: "Clause-level risk detection across waiting periods, exclusions, sublimits, co-payments, and disease caps."
              },
              {
                title: "IRDAI Compliance Engine",
                desc: "Regulatory transparency evaluation, grievance mechanism clarity, portability checks, and compliance scoring."
              },
              {
                title: "Post-Rejection Audit",
                desc: "Clause contradiction detection, documentation gap identification, and appeal strength modeling."
              }
            ].map((item, index) => (
              <div
                key={index}
                className="bg-white p-10 rounded-xl border border-stone/40 hover:border-sage transition animate-fadeUp"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <h3 className="text-xl font-serif mb-4">
                  {item.title}
                </h3>
                <p className="text-charcoal/70 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}

          </div>
        </div>
      </section>


      {/* WORKFLOW */}
      <section className="bg-stone/30 px-6 py-32">
        <div className="max-w-5xl mx-auto text-center">

          <h2 className="text-3xl font-serif mb-16">
            Analytical Workflow
          </h2>

          <div className="grid md:grid-cols-3 gap-14 text-left">

            <div className="animate-fadeUp">
              <h4 className="font-serif text-lg mb-3">01. Submit Policy</h4>
              <p className="text-charcoal/70">
                Provide policy document text for structured evaluation.
              </p>
            </div>

            <div className="animate-fadeUp" style={{ animationDelay: "0.15s" }}>
              <h4 className="font-serif text-lg mb-3">02. Deterministic Analysis</h4>
              <p className="text-charcoal/70">
                Hybrid LLM + weighted scoring engine evaluates structural risk density.
              </p>
            </div>

            <div className="animate-fadeUp" style={{ animationDelay: "0.3s" }}>
              <h4 className="font-serif text-lg mb-3">03. Executive Dashboard</h4>
              <p className="text-charcoal/70">
                Receive policy rating, compliance score, red flags, and transparency index.
              </p>
            </div>

          </div>
        </div>
      </section>


      {/* CTA */}
      <section className="px-6 py-32 text-center">
        <div className="max-w-3xl mx-auto animate-fadeUp">

          <h2 className="text-3xl font-serif mb-6">
            Make Informed Insurance Decisions
          </h2>

          <p className="text-charcoal/70 mb-10">
            Replace brochure-driven decisions with structured financial intelligence.
          </p>

          <Link
            href="/prepurchase"
            className="px-10 py-5 bg-sage text-white rounded-md text-lg hover:opacity-90 transition"
          >
            Begin Analysis
          </Link>

        </div>
      </section>


      {/* FOOTER */}
      <footer className="border-t border-stone/50 py-12 text-center text-charcoal/60 text-sm">
        © 2026 CareBridge AI · Insurance Intelligence Platform
      </footer>

    </main>
  );
}
