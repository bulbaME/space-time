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
        d="M11.828 29.398l-.001.002a3.656 3.656 0 000 5.174 3.656 3.656 0 005.173 0h.001l11.333-11.287v27.38A3.675 3.675 0 0032 54.333a3.675 3.675 0 003.666-3.666V23.294L46.973 34.6a3.688 3.688 0 005.201 0 3.655 3.655 0 000-5.174L34.601 11.853a3.656 3.656 0 00-5.174 0s0 0 0 0l-17.6 17.546z"
        fill="inherit"
        stroke="inheirt"
        strokeWidth={2}
      />
    </svg>
  )
}

export default SvgComponent
