import * as React from "react"

function SvgComponent(props) {
  return (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 233 233"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={props.className}
    >
      <circle cx={116.5} cy={116.5} r={116.5} fill="#5B76A9" />
      <circle cx={117.372} cy={110.133} r={34.051} fill="#CBD1E2" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M117.372 153.114c-34.711 0-64.282 22.008-75.521 52.831C62.067 222.835 88.096 233 116.5 233c29.028 0 55.577-10.617 75.974-28.179-11.542-30.233-40.814-51.707-75.102-51.707z"
        fill="#CBD1E2"
      />
    </svg>
  )
}

export default SvgComponent
