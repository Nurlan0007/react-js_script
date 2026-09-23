export default function Header({ name, tagline, photo }) {
  // BASE_URL keeps the image path correct on GitHub Pages
  const src = import.meta.env.BASE_URL + photo
  return (
    <header className="hero">
      <div>
        <h1>{name}</h1>
        <p className="tagline">{tagline}</p>
      </div>
      <img className="photo" src={src} alt={`Portrait of ${name}`} />
    </header>
  )
}
