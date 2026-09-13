/**
 * A phone number in display type.
 *
 * Playfair has no plus sign, so a leading "+" fell back to another face — a
 * thinner, cooler glyph beside warm ink numerals, visible on paper in the
 * footer, the enquiry block and on /contact. The plus is set in the sans at
 * the same weight; the digits stay in whatever face the caller set. The number
 * itself is content and is not touched: this only changes the face of one
 * character, so screen readers hear exactly what they heard before.
 */
export function Phone({ number }: { number: string }) {
  if (!number.startsWith("+")) return <>{number}</>;
  return (
    <>
      <span className="font-sans font-light">+</span>
      {number.slice(1)}
    </>
  );
}
