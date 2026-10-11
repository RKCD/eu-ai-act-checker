"use client";
export default function PrintButton() {
  return <button className="btn small secondary" onClick={() => window.print()}>PDF / prindi</button>;
}
