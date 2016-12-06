import './index.css'

import {Observable} from 'rxjs'

function fromDelegateEvent (source, selector, type) {
  return Observable.fromEvent(source, type)
    .filter(event => event.target.matches(selector))
}

export default function spreadSheet (element) {
  const a$ = fromDelegateEvent(element, 'input[name="a"]', 'input')
    .map(event => event.target.value)
    .startWith(3)
    .distinctUntilChanged()

  const b$ = fromDelegateEvent(element, 'input[name="b"]', 'input')
    .map(event => event.target.value)
    .startWith(2)
    .distinctUntilChanged()

  const state$ = Observable.combineLatest(a$, b$, (a, b) => ({a, b}))

  return state$.map(({a, b, sum}) =>
    `<div id="nrk-root">
      <input type="text" name="a" value="${a}">
      &times; <input type="text" name="b" value="${b}">
      = <span class="nrk-sum">${(a || 0) * (b || 0)}</span>
    </div>`
  )
}
