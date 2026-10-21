// Original SVG artwork stays sharp at every size and needs no image service.
export default function VenueIllustration({ type = 'Library', hero = false }) {
  const colors = {
    Library: ['#e8eddf', '#a8b89a', '#526d50', '#d0b38a'],
    'Café': ['#f1e6db', '#d5b498', '#9b674b', '#ccb485'],
    Coworking: ['#e2e9e9', '#abc3c5', '#50797b', '#d8bea0'],
    Campus: ['#ebe7f0', '#c1b5cf', '#796488', '#c9b49a'],
  };
  const [background, light, dark, wood] = colors[type] || colors.Library;
  return <svg className={`venue-art ${hero ? 'hero-art' : ''}`} viewBox="0 0 400 220" fill="none" aria-hidden="true">
    <rect width="400" height="220" fill={background} />
    <path d="M0 180h400v40H0z" fill={light} opacity=".3" />
    <path d="M30 180V66a45 45 0 0 1 90 0v114" fill="#fff" opacity=".58" />
    <path d="M75 23v157M31 91h88" stroke={light} strokeWidth="4" />
    <path d="M36 174l35-48 18 21 28-39v66" fill={light} opacity=".55" />
    <rect x="152" y="35" width="114" height="66" rx="2" fill={wood} />
    <rect x="157" y="40" width="104" height="56" fill={background} />
    {type === 'Library' || type === 'Campus' ? <g>
      <path d="M160 68h98" stroke={wood} strokeWidth="4" />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((n) => <rect key={n} x={165 + n * 11} y={n % 2 ? 46 : 44} width="7" height={n % 2 ? 20 : 22} rx="1" fill={n % 3 ? dark : wood} opacity={.5 + (n % 3) * .2} />)}
      {[0, 1, 2, 3, 4, 5].map((n) => <rect key={n} x={170 + n * 13} y="73" width="9" height="19" rx="1" fill={n % 2 ? light : dark} />)}
    </g> : <g><circle cx="207" cy="67" r="18" fill={light}/><path d="M180 91l28-31 28 31" fill={dark} opacity=".7"/><circle cx="238" cy="51" r="7" fill={wood}/></g>}
    <ellipse cx="212" cy="206" rx="112" ry="8" fill={dark} opacity=".1" />
    <path d="M142 156l-6 49m126-49 6 49" stroke={dark} strokeWidth="7" />
    <rect x="124" y="148" width="162" height="9" rx="4" fill={wood} />
    <path d="M172 147l-6-39h61l7 39" fill={dark} />
    <path d="M172 112h50l5 30h-50z" fill={light} />
    <circle cx="198" cy="126" r="4" fill={background}/>
    <rect x="160" y="146" width="80" height="3" rx="1" fill={dark}/>
    <rect x="246" y="131" width="15" height="16" rx="3" fill="#fff" opacity=".85"/>
    <path d="M261 133h4c7 0 7 10 0 10h-4" stroke="#fff" strokeWidth="3"/>
    <path d="M137 166v-30c0-6-4-10-10-10h-18c-7 0-10 4-10 10v32" fill={light}/>
    <path d="M101 168l-3 37m33-37 3 37" stroke={dark} strokeWidth="5"/>
    <rect x="95" y="164" width="44" height="7" rx="3" fill={dark}/>
    <path d="M326 157V89m0 34c-26 0-32-21-30-33 23 0 32 17 30 33m0-12c23 0 31-20 29-33-23 0-31 18-29 33m0-21c-16-5-22-25-15-38 18 8 21 24 15 38" stroke={dark} strokeWidth="3" fill={dark} opacity=".8"/>
    <path d="M307 154h39l-6 40h-27z" fill={wood}/>
    {hero && <g><path d="M283 40l5-10 5 10 10 5-10 5-5 10-5-10-10-5z" fill={dark}/><circle cx="136" cy="27" r="3" fill={dark}/></g>}
  </svg>;
}
