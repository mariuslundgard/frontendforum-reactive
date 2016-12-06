import './index.css'

import 'rxjs/add/observable/timer'
import 'rxjs/add/operator/map'
import {Observable} from 'rxjs/Observable'

export default function countDown () {
  const secondsLeft = 1000
  const seconds$ = Observable.timer(0, 1000)

  return seconds$.map((time) =>
    `<div id="nrk-root">
      ${secondsLeft - time}
    </div>`
  )
}
