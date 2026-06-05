import { Metadata } from "next"

import { getBaseURL } from "@lib/util/env"
import Nav from "@modules/layout/components/global-nav"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default function PageLayout(props: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      {props.children}
    </>
  )
}
