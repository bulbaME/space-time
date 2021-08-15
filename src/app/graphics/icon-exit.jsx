import * as React from "react"

function SvgComponent(props) {
  return (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 65 66"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M57.694 7.307h-21.92a3.664 3.664 0 01-3.654-3.653A3.664 3.664 0 0135.773 0h21.921c4.019 0 7.307 3.288 7.307 7.307v51.149c0 4.019-3.288 7.307-7.307 7.307h-21.92a3.664 3.664 0 01-3.654-3.654 3.664 3.664 0 013.653-3.653h21.921V7.307z"
        fill="inherit"
      />
      <path
        d="M.517 31.603L10.71 21.409c1.17-1.169 3.142-.365 3.142 1.28v6.539h25.575a3.664 3.664 0 013.653 3.653 3.664 3.664 0 01-3.653 3.654H13.852v6.54c0 1.644-1.973 2.447-3.105 1.278L.554 34.16a1.798 1.798 0 01-.037-2.557z"
        fill="inherit"
      />
    </svg>
  )
}

export default SvgComponent
