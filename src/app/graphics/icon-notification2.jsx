import * as React from "react"

function SvgComponent(props) {
  return (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 48 53"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M22 52.667c2.933 0 5.333-2.4 5.333-5.334H16.667A5.332 5.332 0 0022 52.667zm16-29.334c0-8.186-4.373-15.04-12-16.853V4.667c0-2.214-1.787-4-4-4s-4 1.786-4 4V6.48c-.64.16-1.253.4-1.84.613L38 28.933v-5.6zM4.426 2.933l-3.76 3.76 7.494 7.494C6.773 16.853 6 19.947 6 23.333v13.334l-3.44 3.44c-1.68 1.68-.507 4.56 1.866 4.56H38.64l4.64 4.64 3.76-3.76L4.426 2.933z"
        fill="inherit"
      />
    </svg>
  )
}

export default SvgComponent
