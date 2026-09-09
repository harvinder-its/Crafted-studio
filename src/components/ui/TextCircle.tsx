/**
 * Replaces the `.text-circle` routine in designesia.js: each character of
 * `data-text` is rotated around the circle's centre. The spin animation itself
 * lives in style.css, so this is pure markup and can stay a Server Component.
 */
export default function TextCircle({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const chars = [...text];

  return (
    <div className={`text-circle ${className}`.trim()} aria-hidden="true">
      {chars.map((char, i) => (
        <span
          key={i}
          style={{ transform: `rotate(${(360 / chars.length) * i}deg) translateY(-50%)` }}
        >
          {char}
        </span>
      ))}
    </div>
  );
}
