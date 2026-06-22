export {}

interface QFn {
  (selector: string): HTMLElement[]
  (root: ParentNode, selector: string): HTMLElement | null
}

type TextNodeFn = (n: Node) => string | false
type TextFn = (e: Element | null | undefined) => string
type EffectFn = (e: Element | null | undefined) => string
type LinkFn = (e: Element | null | undefined) => string

declare global {
  interface Window {
    Q: QFn
    textNode: TextNodeFn
    markupNode: TextNodeFn
    text: TextFn
    effect: EffectFn
    link: LinkFn
  }

  var Q: QFn
  var textNode: TextNodeFn
  var markupNode: TextNodeFn
  var text: TextFn
  var effect: EffectFn
  var link: LinkFn
}
