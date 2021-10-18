import * as React from "react"

function SvgComponent(props) {
  return (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 50 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M24.917 2C12.267 2 2 12.267 2 24.917c0 12.65 10.267 22.916 22.917 22.916 12.65 0 22.916-10.266 22.916-22.916S37.567 2 24.917 2zm0 41.25c-10.107 0-18.334-8.227-18.334-18.333 0-10.107 8.227-18.334 18.334-18.334 10.106 0 18.333 8.227 18.333 18.334 0 10.106-8.227 18.333-18.333 18.333z"
        fill="inherit"
        stroke="inherit"
        strokeWidth={3}
      />
      <rect x={14} y={22} width={21} height={6} rx={3} fill="inherit" />
      <rect
        x={28}
        y={15}
        width={21}
        height={6}
        rx={3}
        transform="rotate(90 28 15)"
        fill="inherit"
      />
    </svg>
  )
}

export default SvgComponent
