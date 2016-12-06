/* eslint-disable better/no-ifs, fp/no-let, fp/no-mutation */

import './index.css'

import moment from 'moment'
import {Observable} from 'rxjs'
import superagent from 'superagent'

function fromDelegateEvent (source, selector, type) {
  return Observable.fromEvent(source, type)
    .filter(event => event.target.closest(selector))
}

function renderRegionName (searchResult) {
  const {country, name, region, subregion} = searchResult

  const regions = [subregion, region, country]
    .filter((d) => !!d)
    .map((d) => d.name)

  return `${name}, ${regions.join(', ')}`
}

export default function yrSuggestSearch (element) {
  const searchQuery$ = fromDelegateEvent(element, 'input[name="q"]', 'input')
    .map(event => event.target.value)
    .startWith('')

  const searchResults$ = searchQuery$
    .distinctUntilChanged()
    .debounceTime(120)
    .switchMap((searchQuery) => {
      if (searchQuery.length === 0) {
        return Observable.of({_embedded: {location: []}})
      }

      return Observable
        .fromPromise(
          superagent.get(`/yr-api/v0/locations/suggest?language=nb&q=${searchQuery}`)
            .catch(() => ({body: {_embedded: {location: []}}}))
        )
        .map((res) => res.body)
    })
    .map((data) => data._embedded ? data._embedded.location || [] : [])

  const searchResultClick$ = fromDelegateEvent(element, '.nrk-searchResult', 'click')

  const openSearchResult$ = searchResultClick$
    .do(event => event.preventDefault())
    .map(event => event.target.closest('.nrk-searchResult').dataset.id)

  // eslint-disable-next-line fp/no-unused-expression
  openSearchResult$.subscribe(console.log)

  return Observable.combineLatest(searchQuery$, searchResults$, (searchQuery, searchResults) =>
    `<div id="nrk-root">
      <div class="nrk-searchForm">
        <input name="q" value="${searchQuery}" placeholder="Finn et sted..." autocomplete="off">
      </div>
      ${searchResults.map((searchResult = {}) => {
        const {category = {}} = searchResult
        return `<a class="nrk-searchResult" href="#" data-id="${searchResult.id}">
          <div class="nrk-searchResult__categoryName">${category.name}</div>
          <h3 class="nrk-searchResult__name">${renderRegionName(searchResult)}</h3>
        </a>`
      }).join('')}
    </div>`
  )
}
