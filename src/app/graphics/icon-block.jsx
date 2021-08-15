import * as React from "react"

function SvgComponent(props) {
  return (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 51 51"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M25.633 2C12.588 2 2 12.588 2 25.633s10.588 23.633 23.633 23.633 23.633-10.588 23.633-23.633S38.678 2 25.633 2zM6.727 25.633c0-10.446 8.46-18.906 18.906-18.906 4.372 0 8.39 1.488 11.58 3.993L10.72 37.213a18.675 18.675 0 01-3.994-11.58zm18.906 18.906c-4.372 0-8.39-1.489-11.58-3.994l26.492-26.492a18.676 18.676 0 013.994 11.58c0 10.445-8.46 18.906-18.906 18.906z"
        fill="inherit"
        stroke="inherit"
        strokeWidth={2}
      />
    </svg>
  )
}

export default SvgComponent
