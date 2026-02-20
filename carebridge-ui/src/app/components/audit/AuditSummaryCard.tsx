import { AuditReport } from "../../types/audit";

export default function AuditSummaryCard({ report }: { report: AuditReport }) {
  return (
    <div className="bg-white p-8 border border-stone rounded-xl">

      <h2 className="text-2xl font-serif mb-4">
        Case Overview
      </h2>

      <p className="mb-6 text-charcoal/80">
        {report.case_summary}
      </p>

      <div className="flex gap-6">

        <div>
          <p className="text-sm text-charcoal/60">Clause Detected</p>
          <span className="px-4 py-2 bg-stone/40 rounded-md">
            {report.policy_clause_detected}
          </span>
        </div>

        <div>
          <p className="text-sm text-charcoal/60">Clause Alignment</p>
          <span className="px-4 py-2 bg-sage text-white rounded-md">
            {report.clause_alignment}
          </span>
        </div>

      </div>
    </div>
  );
}
