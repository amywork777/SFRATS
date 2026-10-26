interface RatMarkProps {
  size?: number
  tone?: 'plain' | 'yellow' | 'blue'
}

/** The original SF Rats mark, decorative when paired with nearby text. */
export default function RatMark({ size = 72, tone = 'plain' }: RatMarkProps) {
  return (
    <span className={`rat-mark rat-mark--${tone}`} style={{ width: size, height: size }} aria-hidden="true">
      <img src="/sfrats-logo.png" alt="" width={size} height={size} />
    </span>
  )
}
