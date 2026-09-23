import { useState } from 'react'

const mood = (n) =>
  n === 0 ? 'Running on 0 coffees. Dangerous.'
  : n < 3 ? 'Warming up. Bugs are getting nervous.'
  : n < 6 ? 'Peak productivity reached.'
  : 'I can hear colors now. Please stop.'

// useState remembers the number of cups; every click re-renders the component
export default function CoffeeCounter() {
  const [cups, setCups] = useState(0)
  return (
    <section className="card accent">
      <h2>Coffee-driven development</h2>
      <p className="count">{cups} {cups === 1 ? 'cup' : 'cups'}</p>
      <p>{mood(cups)}</p>
      <button onClick={() => setCups(cups + 1)}>Give me coffee</button>
      <button className="ghost" onClick={() => setCups(0)}>Reset</button>
    </section>
  )
}
