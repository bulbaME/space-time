import * as React from "react"

function SvgComponent(props) {
  return (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 67 67"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M14.571 54.123c0 3.361 2.75 6.111 6.111 6.111h24.445c3.36 0 6.11-2.75 6.11-6.11V23.567c0-3.361-2.75-6.111-6.11-6.111H20.682c-3.36 0-6.11 2.75-6.11 6.11v30.556zM51.238 8.29h-7.639l-2.17-2.17a3.082 3.082 0 00-2.138-.886H26.518c-.794 0-1.588.336-2.139.886L22.21 8.29h-7.639a3.065 3.065 0 00-3.055 3.056A3.065 3.065 0 0014.57 14.4h36.667a3.065 3.065 0 003.055-3.056 3.065 3.065 0 00-3.055-3.055z"
        fill="inherit"
      />
    </svg>
  )
}

export default SvgComponent
