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
        d="M51.28 40.693l-6.773-.773a5.309 5.309 0 00-4.374 1.52l-4.906 4.907a40.12 40.12 0 01-17.574-17.574l4.934-4.933a5.309 5.309 0 001.52-4.373l-.774-6.72a5.337 5.337 0 00-5.306-4.72h-4.614c-3.013 0-5.52 2.506-5.333 5.52C9.493 36.32 27.707 54.507 50.453 55.92c3.014.187 5.52-2.32 5.52-5.333v-4.614c.027-2.693-2-4.96-4.693-5.28z"
        fill="inherit"
      />
    </svg>
  )
}

export default SvgComponent
