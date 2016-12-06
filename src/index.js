/* eslint-disable fp/no-unused-expression, fp/no-nil, fp/no-mutation, better/explicit-return */

import './index.css'

import spreadSheet from './02-spreadSheet'
import patch from 'morphdom'

const rootElement = document.querySelector('#nrk-root')

const html$ = spreadSheet(rootElement)
const subscription = html$.subscribe({
  next: html => {
    patch(rootElement, html)
  },
  error: error => {
    rootElement.style.color = '#c00'
    rootElement.style.background = '#fcc'
    rootElement.innerHTML = `Error: ${error.stack}`
  },
  complete: () => {
    rootElement.style.color = '#666'
    rootElement.style.background = '#ccc'
  }
})

// setTimeout(() => {
//   subscription.unsubscribe()
// }, 3500)
