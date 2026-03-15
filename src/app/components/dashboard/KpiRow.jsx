import KpiCard from "./KpiCard";

export default function KpiRow({ items }) {
  return (
    <section className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5'>
      {items.map((item) => (
        <KpiCard
          key={item.id}
          label={item.label}
          value={item.value}
          subValue={item.subValue}
          valueClassName={item.valueClassName}
        />
      ))}
    </section>
  );
}
