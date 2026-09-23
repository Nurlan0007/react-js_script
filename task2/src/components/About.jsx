export default function About({ paragraphs, facts }) {
  return (
    <section className="card">
      <h2>About me</h2>
      {paragraphs.map((text, i) => <p key={i}>{text}</p>)}
      <ul>
        {facts.map((fact) => <li key={fact}>{fact}</li>)}
      </ul>
    </section>
  )
}
