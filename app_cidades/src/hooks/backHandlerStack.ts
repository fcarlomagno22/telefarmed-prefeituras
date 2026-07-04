export type BackHandlerFn = () => boolean

const handlerStack: BackHandlerFn[] = []

export function pushBackHandler(handler: BackHandlerFn) {
  handlerStack.push(handler)
}

export function removeBackHandler(handler: BackHandlerFn) {
  const index = handlerStack.lastIndexOf(handler)
  if (index >= 0) {
    handlerStack.splice(index, 1)
  }
}

export function runBackHandlers(): boolean {
  for (let index = handlerStack.length - 1; index >= 0; index -= 1) {
    if (handlerStack[index]()) {
      return true
    }
  }

  return false
}

export function hasBackHandlers(): boolean {
  return handlerStack.length > 0
}
