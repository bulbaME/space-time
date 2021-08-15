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
        d="M8 46.56v8.107A1.32 1.32 0 009.333 56h8.107c.347 0 .693-.133.933-.4l29.12-29.093-10-10L8.4 45.6c-.267.267-.4.587-.4.96zm47.227-27.787a2.656 2.656 0 000-3.76l-6.24-6.24a2.656 2.656 0 00-3.76 0l-4.88 4.88 10 10 4.88-4.88z"
        fill="inherit"
      />
    </svg>
  )
}

export default SvgComponent
