import * as React from "react"

function SvgComponent(props) {
  return (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 61 61"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M35.583 22.875v-4.041c0-2.262 2.745-3.406 4.347-1.805l11.666 11.666a2.531 2.531 0 010 3.584L39.93 43.945c-1.602 1.602-4.347.483-4.347-1.779v-4.295c-12.708 0-21.604 4.066-27.958 12.962 2.542-12.708 10.167-25.416 27.958-27.958z"
        fill="#inherit"
      />
    </svg>
  )
}

export default SvgComponent
