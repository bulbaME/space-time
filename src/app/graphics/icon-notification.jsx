import * as React from "react"

function SvgComponent(props) {
  return (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 43 55"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M21.398 55c3.102 0 5.64-2.538 5.64-5.641H15.758A5.64 5.64 0 0021.397 55zM38.32 38.077V23.974c0-8.659-4.626-15.907-12.692-17.825V4.23C25.628 1.89 23.738 0 21.398 0a4.225 4.225 0 00-4.231 4.23V6.15C9.072 8.067 4.475 15.287 4.475 23.974v14.103L.836 41.715C-.94 43.492.3 46.538 2.811 46.538h37.146c2.51 0 3.78-3.046 2.002-4.823l-3.638-3.638z"
        fill="inherit"
      />
    </svg>
  )
}

export default SvgComponent
