import * as React from "react"

function SvgComponent(props) {
  return (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 65 15"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <circle cx={57.5} cy={7.5} r={7.5} fill="inherit" />
      <circle cx={32.5} cy={7.5} r={7.5} fill="inherit" />
      <circle cx={7.5} cy={7.5} r={7.5} fill="inherit" />
    </svg>
  )
}

export default SvgComponent
