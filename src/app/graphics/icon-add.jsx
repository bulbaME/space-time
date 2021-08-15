import * as React from "react"

function SvgComponent(props) {
  return (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 42 42"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M38.5 23.917H23.917V38.5A2.925 2.925 0 0121 41.417a2.925 2.925 0 01-2.916-2.917V23.917H3.5A2.925 2.925 0 01.583 21 2.925 2.925 0 013.5 18.083h14.584V3.5A2.925 2.925 0 0121 .583 2.925 2.925 0 0123.917 3.5v14.583H38.5A2.925 2.925 0 0141.417 21a2.925 2.925 0 01-2.917 2.917z"
        fill="inherit"
      />
    </svg>
  )
}

export default SvgComponent
