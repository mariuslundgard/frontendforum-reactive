/* eslint-disable better/explicit-return, better/no-ifs, fp/no-mutation, fp/no-let, fp/no-nil, fp/no-unused-expression */

import './index.css'

import moment from 'moment'

const noop = () => {}

const map = (f, observable) =>
  observer =>
    observable({...observer, next: value => observer.next(f(value))})

const timer = (dueTime, period) =>
  observer => {
    const {next, complete = noop} = observer

    let intervalId = null
    let index = 0

    const timeoutId = setTimeout(() => {
      next(++index)
      if (period) intervalId = setInterval(next, period)
    }, dueTime)

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
      if (intervalId) clearInterval(intervalId)
      complete()
    }
  }

export default function clock () {
  const time$ = map(() => moment(), timer(0, 1000))
  const html$ = map(time => `<div id="nrk-root">${time.format('HH:mm:ss')}</div>`, time$)

  return {
    subscribe: observer => {
      return {unsubscribe: html$(observer)}
    }
  }
}
