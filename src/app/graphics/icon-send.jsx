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
        d="M11.262 53.62L55.52 34.648c2.054-.887 2.054-3.779 0-4.666L11.262 11.01c-1.674-.735-3.526.508-3.526 2.308l-.025 11.693c0 1.268.938 2.358 2.206 2.51l35.838 4.794-35.838 4.768a2.566 2.566 0 00-2.206 2.537l.025 11.692c0 1.8 1.852 3.043 3.526 2.308z"
        fill="inherit"
      />
    </svg>
  )
}

export default SvgComponent
