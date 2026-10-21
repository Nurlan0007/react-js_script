import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  const pages = [...new Set([1, page - 1, page, page + 1, totalPages])].filter((value) => value >= 1 && value <= totalPages).sort((a, b) => a - b);
  return <nav className="pagination" aria-label="Results pages">
    <button className="page-direction" disabled={page === 1} onClick={() => onChange(page - 1)}><ChevronLeft size={16}/><span>Previous</span></button>
    <div className="page-numbers">{pages.map((number, index) => <span className="page-group" key={number}>
      {index > 0 && number - pages[index - 1] > 1 && <span className="ellipsis">…</span>}
      <button aria-label={`Page ${number}`} aria-current={page === number ? 'page' : undefined} onClick={() => onChange(number)}>{number}</button>
    </span>)}</div>
    <button className="page-direction" disabled={page === totalPages} onClick={() => onChange(page + 1)}><span>Next</span><ChevronRight size={16}/></button>
  </nav>;
}
