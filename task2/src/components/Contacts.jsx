export default function Contacts({ items }) {
  return (
    <section className="card">
      <h2>Contacts</h2>
      <dl>
        {items.map(({ label, value, href }) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{href ? <a href={href} target="_blank" rel="noreferrer">{value}</a> : value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
