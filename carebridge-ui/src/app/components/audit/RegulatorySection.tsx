export default function RegulatorySection({ text }: { text: string }) {
  return (
    <div className="bg-white p-8 border border-stone rounded-xl">
      <h2 className="text-2xl font-serif mb-4">
        Regulatory Considerations
      </h2>
      <p className="text-charcoal/80">{text}</p>
    </div>
  );
}
