import * as React from "react"

function SvgComponent(props) {
  return (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 57 57"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={props.className}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M28.5 57C44.24 57 57 44.24 57 28.5S44.24 0 28.5 0 0 12.76 0 28.5 12.76 57 28.5 57zM30 16a2 2 0 00-4 0v24a2 2 0 004 0V16z"
        fill="inherit"
      />
    </svg>
  )
}

export default SvgComponent
