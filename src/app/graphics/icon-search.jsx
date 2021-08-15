import * as React from "react"

function SvgComponent(props) {
  return (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 35 35"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M22.604 20.417h-1.152l-.408-.394a9.48 9.48 0 002.158-7.788c-.685-4.054-4.069-7.291-8.152-7.787C8.88 3.69 3.69 8.88 4.448 15.05c.496 4.083 3.733 7.467 7.787 8.152a9.48 9.48 0 007.788-2.158l.394.408v1.152l6.197 6.198a1.54 1.54 0 002.173 0 1.54 1.54 0 000-2.173l-6.183-6.212zm-8.75 0a6.554 6.554 0 01-6.562-6.563 6.554 6.554 0 016.562-6.562 6.554 6.554 0 016.563 6.562 6.554 6.554 0 01-6.563 6.563z"
        fill="inherit"
      />
    </svg>
  )
}

export default SvgComponent
