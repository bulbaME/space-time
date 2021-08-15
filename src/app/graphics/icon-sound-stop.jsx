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
        d="M21.333 16h21.334C45.6 16 48 18.4 48 21.333v21.334C48 45.6 45.6 48 42.667 48H21.333C18.4 48 16 45.6 16 42.667V21.333C16 18.4 18.4 16 21.333 16z"
        fill="inherit"
      />
    </svg>
  )
}

export default SvgComponent
