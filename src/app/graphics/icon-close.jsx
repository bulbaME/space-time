import * as React from "react"

function SvgComponent(props) {
  return (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M49.154 14.873a3.156 3.156 0 00-4.467 0h0L32 27.533 19.314 14.846a3.156 3.156 0 00-4.467 0 3.156 3.156 0 000 4.468L27.533 32 14.847 44.686a3.156 3.156 0 000 4.468 3.156 3.156 0 004.467 0L32 36.467l12.687 12.687a3.156 3.156 0 004.467 0 3.156 3.156 0 000-4.468L36.467 32l12.687-12.686c1.209-1.209 1.209-3.232 0-4.44z"
        fill="inherit"
        stroke="inherit"
      />
    </svg>
  )
}

export default SvgComponent
