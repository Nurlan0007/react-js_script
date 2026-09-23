import Header from './components/Header.jsx'
import About from './components/About.jsx'
import CoffeeCounter from './components/CoffeeCounter.jsx'
import Contacts from './components/Contacts.jsx'
import { profile } from './data.js'

// App only assembles the page from components and passes data down as props
export default function App() {
  return (
    <>
      <Header name={profile.name} tagline={profile.tagline} photo={profile.photo} />
      <main>
        <About paragraphs={profile.about} facts={profile.facts} />
        <CoffeeCounter />
        <Contacts items={profile.contacts} />
      </main>
      <footer>Built with React, coffee and {'<3'}</footer>
    </>
  )
}
