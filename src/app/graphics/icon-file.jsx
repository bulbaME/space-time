import * as React from "react"

function SvgComponent(props) {
  return (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M6.625 4a1.61 1.61 0 00-1.617 1.6L5 18.4c0 .88.723 1.6 1.617 1.6h9.758c.894 0 1.625-.72 1.625-1.6V9.464c0-.424-.17-.832-.48-1.128l-3.924-3.864A1.61 1.61 0 0012.451 4H6.625zm5.688 4.8V5.2l4.468 4.4h-3.656a.809.809 0 01-.813-.8z"
        fill="inherit"
      />
    </svg>
  )
}

export default SvgComponent
