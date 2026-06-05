import { useState } from "react"

export interface StateType {
  state: boolean
  open: () => void
  close: () => void
  toggle: () => void
}

const useToggleState = (initialState = false): StateType => {
  const [state, setState] = useState<boolean>(initialState)

  const open = () => setState(true)
  const close = () => setState(false)
  const toggle = () => setState((state) => !state)

  return { state, open, close, toggle }
}

export default useToggleState
