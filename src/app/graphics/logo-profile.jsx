import * as React from "react"

function SvgComponent(props) {
  return (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 116 116"
      xmlns="http://www.w3.org/2000/svg"
      className={props.className}
    >
      <circle cx={57.799} cy={48.5} r={14.5} fill="inherit" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M26 87.021c5.41-12.017 17.578-20.395 31.724-20.395 14.02 0 26.1 8.23 31.579 20.078C81.517 95.474 70.159 101 57.509 101 45.013 101 33.776 95.607 26 87.021z"
        fill="inherit"
      />
    </svg>
  )
}

export default SvgComponent
