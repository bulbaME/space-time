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
        d="M8 26.667v10.666C8 38.8 9.2 40 10.667 40h8l8.773 8.773c1.68 1.68 4.56.48 4.56-1.893V17.093c0-2.373-2.88-3.573-4.56-1.893L18.667 24h-8A2.675 2.675 0 008 26.667zM44 32c0-4.72-2.72-8.773-6.667-10.747V42.72C41.28 40.773 44 36.72 44 32zm-6.667-20.133v.533c0 1.013.667 1.893 1.6 2.267C45.813 17.413 50.667 24.16 50.667 32c0 7.84-4.854 14.587-11.734 17.333-.96.374-1.6 1.254-1.6 2.267v.533c0 1.68 1.68 2.854 3.227 2.267C49.6 50.96 56 42.24 56 32c0-10.24-6.4-18.96-15.44-22.4-1.547-.613-3.227.587-3.227 2.267z"
        fill="inherit"
      />
    </svg>
  )
}

export default SvgComponent
