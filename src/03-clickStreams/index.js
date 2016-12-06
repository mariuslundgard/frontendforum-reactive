import './index.css'

import {Observable} from 'rxjs'

export default function clickStreams (element) {
  const initialState = {buttonClicks: 0, containerClicks: 0}

  const click$ = Observable.fromEvent(element, 'click')

  const incButtonClick$ = click$
    .filter(event => event.target.closest('button'))
    .map(() => state => ({...state, buttonClicks: state.buttonClicks + 1}))

  const incContainerClick$ = click$
    .filter(event => !event.target.closest('button'))
    .map(() => state => ({...state, containerClicks: state.containerClicks + 1}))

  const mutation$ = Observable.merge(incButtonClick$, incContainerClick$)

  const state$ = mutation$
    .scan((state, mutation) => mutation(state), initialState)
    .startWith(initialState)

  return state$.map(({buttonClicks, containerClicks}) =>
    `<div id="nrk-root">
      <button class="nrk-button">Click it</button>
      <div>Button clicks: ${buttonClicks}</div>
      <div>Container clicks: ${containerClicks}</div>
    </div>`
  )
}
