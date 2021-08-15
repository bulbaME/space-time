import * as React from "react"

function SvgComponent(props) {
  return (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 59 59"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M29.5 42.455l10.202 6.17c1.868 1.132 4.154-.54 3.663-2.654L40.66 34.368l9.022-7.818c1.647-1.426.762-4.13-1.402-4.302L36.408 21.24 31.76 10.276c-.835-1.991-3.687-1.991-4.523 0l-4.646 10.94-11.874 1.007c-2.163.172-3.048 2.877-1.401 4.302l9.022 7.818-2.704 11.603c-.492 2.114 1.794 3.786 3.663 2.655L29.5 42.455z"
        fill="#inherit"
      />
    </svg>
  )
}

export default SvgComponent
