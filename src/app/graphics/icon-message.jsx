import * as React from "react"

function SvgComponent(props) {
  return (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 54 54"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M45 4.5H9A4.513 4.513 0 004.5 9v40.5l9-9H45c2.475 0 4.5-2.025 4.5-4.5V9c0-2.475-2.025-4.5-4.5-4.5z"
        fill="inherit"
      />
    </svg>
  )
}

export default SvgComponent
