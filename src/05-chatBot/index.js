/* eslint-disable better/explicit-return, better/no-ifs, fp/no-let, fp/no-mutation, fp/no-nil, fp/no-unused-expression */

import './index.css'

import {Observable} from 'rxjs'
import shortid from 'shortid'

function fromDelegateEvent (source, selector, type) {
  return Observable.fromEvent(source, type)
    .filter((event) => event.target.closest(selector))
}

function renderDialog (data) {
  if (data.isSent) {
    return `<form class="nrk-dialog" data-id="${data.id}">
      <div class="nrk-message nrk-message--machine">
        <p>${data.text.split('\n\n').join('</p><p>')}</p>
      </div>
      <div class="nrk-message nrk-message--human">
        <p>${data.value.split('\n\n').join('</p><p>')}</p>
      </div>
    </form>`
  }

  switch (data.type) {
    case 'input':
      return `<form class="nrk-dialog nrk-dialog--input" data-id="${data.id}" method="post" action="/">
        <div class="nrk-message nrk-message--machine">
          <p>${data.text.split('\n\n').join('</p><p>')}</p>
        </div>
        <div class="nrk-input nrk-input--input">
          <input type="text" name="dialogInput" value="${data.value}">
          <input type="submit">
        </div>
      </form>`

    case 'select':
      return `<form class="nrk-dialog nrk-dialog--select" data-id="${data.id}">
        <div class="nrk-message nrk-message--machine">
          <p>${data.text.split('\n\n').join('</p><p>')}</p>
        </div>
        <div class="nrk-input nrk-input--select">
          ${data.options.map((option, index) =>
            `<button name="dialogButton" data-index="${data.index}">${option.label}</button>`
          ).join('')}
        </div>
      </form>`
  }

  return ``
}

function renderDecisionTreeNodeInputs (newNode) {
  switch (newNode.type) {
    case 'input':
      return `<div>
        <label>Question</label>
        <textarea name="nodeText">${newNode.text}</textarea>
      </div>`

    case 'select':
      return `<div>
        <label>Question</label>
        <textarea name="nodeText">${newNode.text}</textarea>
      </div>
      <fieldset>
        <legend>Options</legend>
        ${newNode.options.map((option, index) =>
          `<div class="nrk-decisionTree__selectOption" data-index="${index}">
            <div>
              <label>Label</label>
              <input type="text" name="nodeOptionLabel[]" value="${option.label}">
            </div>
            <div>
              <label>Value</label>
              <input type="text" name="nodeOptionValue[]" value="${option.value}">
            </div>
          </div>`
        ).join('')}
        <button class="nrk-decisionTree__addOptionButton">Add option</button>
      </fieldset>`
  }

  return `<pre>${JSON.stringify(newNode)}</pre>`
}

function buildTree (items) {
  if (items.length === 0) return null

  const sourceNodes = items.map((node) => ({...node}))
  const tree = sourceNodes.shift() // eslint-disable-line

  const setChildren = (n) => { // eslint-disable-line
    n.childNodes = sourceNodes.filter((s) => n.id === s.parentId)
    n.childNodes.forEach(setChildren)
  }

  setChildren(tree)

  return tree
}

function renderDecisionTreeNode (node) {
  switch (node.type) {
    case 'input':
      return `<div class="nrk-decisionTreeNode" data-id="${node.id}" draggable="true">
        <div>Question (${node.name}): <strong>${node.text}</strong> <button name="delete">delete</button></div>
        <div>${node.childNodes.map(renderDecisionTreeNode).join('')}</div>
      </div>`
    case 'select':
      return `<div class="nrk-decisionTreeNode" data-id="${node.id}" draggable="true">
        <div>Multiple choice (${node.name}): <strong>${node.text}</strong> <button name="delete">delete</button></div>
        <div>${node.options.map((o) => `<button>${o.label}</button>`).join('')}</div>
        <div>${node.childNodes.map(renderDecisionTreeNode).join('')}</div>
      </div>`
  }

  return `<div>${node.type}</div>`
}

function renderDecisionTree (data) {
  const {decisions, newNode} = data
  const decisionTree = buildTree(decisions)

  return `<div class="nrk-decisionTree">
    ${decisionTree ? renderDecisionTreeNode(decisionTree) : ''}
    <form class="nrk-decisionTree__form">
      <div>
        <select name="newDecisionTreeNodeType">
          <option value="input"${newNode.type === 'input' ? ' selected' : ''}>Question</option>
          <option value="select"${newNode.type === 'select' ? ' selected' : ''}>Multiple choice</option>
        </select>
        <div>
          <label>Key</label>
          <input type="text" name="newDecisionTreeNodeName" value="${newNode.name}">
        </div>
        ${renderDecisionTreeNodeInputs(newNode)}
      </div>
      <button type="submit" class="nrk-decisionTree__submitButton nrk-button">Add</button>
    </form>
  </div>`
}

function renderDialogList (data) {
  const {dialogs} = data
  return `<div class="nrk-dialogList">
    <h1>#nrkvalg</h1>
    ${dialogs.map(renderDialog).join('')}
    ${dialogs.length && dialogs[dialogs.length - 1].isSent ? '<div class="nrk-dialog"><div class="nrk-message"><p>...</p></div></div>' : ''}
  </div>`
}

function render (data) {
  const {dialogs, newNode, decisions} = data

  return `<div class="nrk-example" id="nrk-root">
    ${renderDialogList({dialogs})}
    ${renderDecisionTree({newNode, decisions})}
  </div>`
}

export default function chatBot (element) {
  const setDialogInput$ = fromDelegateEvent(element, '[name="dialogInput"]', 'input')
    .map((event) => {
      const id = event.target.closest('.nrk-dialog').dataset.id
      return (state) => {
        return {
          ...state,
          dialogs: state.dialogs.map((dialog) => {
            if (dialog.id === id) {
              return {...dialog, value: event.target.value}
            }
            return dialog
          })
        }
      }
    })

  const setNodeQuestion$ = fromDelegateEvent(element, '[name="nodeText"]', 'input')
    .map((event) => (state) => ({
      ...state,
      newNode: {
        ...state.newNode,
        text: event.target.value
      }
    }))

  const newDecisionTreeNodeType$ = fromDelegateEvent(element, '[name="newDecisionTreeNodeType"]', 'change')
    .map((event) => (state) => {
      const type = event.target.value

      switch (type) {
        case 'select':
          return {
            ...state,
            newNode: {
              id: shortid.generate(),
              type,
              name: '',
              text: '',
              value: '',
              options: [{
                value: '',
                label: '',
                value: '',
                targetId: -1
              }]
            }
          }
      }

      return {
        ...state,
        newNode: {
          id: shortid.generate(),
          type,
          name: '',
          text: '',
          value: ''
        }
      }
    })

  const newDecisionTreeNodeName$ = fromDelegateEvent(element, '[name="newDecisionTreeNodeName"]', 'input')
    .map((event) => (state) => {
      const name = event.target.value

      return {
        ...state,
        newNode: {
          ...state.newNode,
          name
        }
      }
    })

  const updateSelectOption$ = fromDelegateEvent(element, '.nrk-decisionTree__selectOption input', 'input')
    .map((event) => (state) => {
      const keys = {
        'nodeOptionValue[]': 'value',
        'nodeOptionLabel[]': 'label'
      }
      const key = keys[event.target.name]
      const index = parseInt(event.target.closest('.nrk-decisionTree__selectOption').dataset.index, 10)
      const newNode = {...state.newNode}

      if (!newNode.options) newNode.options = []
      if (!newNode.options[index]) newNode.options[index] = {name: '', value: ''}

      newNode.options[index][key] = event.target.value

      return {
        ...state,
        newNode
      }
    })

  const addOption$ = fromDelegateEvent(element, '.nrk-decisionTree__addOptionButton', 'click')
    .map((event) => {
      event.preventDefault()
      return (state) => {
        return {
          ...state,
          newNode: {
            ...state.newNode,
            options: state.newNode.options.concat([{
              value: '',
              label: '',
              value: '',
              targetId: null
            }])
          }
        }
      }
    })

  const submitDecisionTreeNode$ = fromDelegateEvent(element, '.nrk-decisionTree__submitButton', 'click')
    .map((event) => {
      event.preventDefault()

      return (state) => {
        let dialogs = state.dialogs

        if (dialogs.length === 0) {
          dialogs = dialogs.concat([state.newNode])
        }

        return {
          ...state,
          dialogs,
          decisions: state.decisions.concat([{
            parentId: state.decisions.length ? state.decisions[state.decisions.length - 1].id : null,
            ...state.newNode
          }]),
          newNode: {
            id: shortid.generate(),
            type: 'input',
            name: '',
            text: '',
            value: ''
          }
        }
      }
    })

  const nodeDrag$ = fromDelegateEvent(element, '.nrk-decisionTreeNode', 'dragstart')
    .map((event) => {
      event.stopPropagation()
      return event.target.closest('.nrk-decisionTreeNode').dataset.id
    })

  const nodeDrop$ = fromDelegateEvent(element, '.nrk-decisionTreeNode', 'drop')
    .map((event) => {
      event.stopPropagation()
      return event.srcElement.closest('.nrk-decisionTreeNode').dataset.id
    })

  const nodeDragover$ = fromDelegateEvent(element, '.nrk-decisionTreeNode', 'dragover')

  nodeDragover$
    .subscribe((event) => {
      event.preventDefault()
    })

  const moveDecisionNode$ = nodeDrag$
    .switchMap((id) => {
      return nodeDrop$.map((parentId) => {
        return {
          id,
          parentId
        }
      })
    })
    .filter((data) => data.id !== data.parentId)
    .map((data) => {
      return (state) => {
        return {
          ...state,
          decisions: state.decisions.map((n) => {
            if (n.id === data.id) {
              return {...n, ...data}
            }
            return n
          })
        }
      }
    })

  const submitDialogInputEnter$ = fromDelegateEvent(element, '[name="dialogInput"]', 'keydown')
    .filter((event) => event.key === 'Enter')
  const submitDialogInputButton$ = fromDelegateEvent(element, '.nrk-dialog', 'submit')

  const submitDialogInput$ = Observable.merge(submitDialogInputEnter$, submitDialogInputButton$)
    .flatMap((event) => {
      event.preventDefault()
      const id = event.target.closest('.nrk-dialog').dataset.id
      return Observable.merge(
        Observable.of((state) => {
          return {
            ...state,
            dialogs: state.dialogs.map((d) => {
              if (d.id === id) return {...d, isSent: true}
              return d
            })
          }
        }),
        Observable.of((state) => {
          if (!state.decisions[state.dialogs.length]) return state
          return {
            ...state,
            dialogs: state.dialogs.concat([{
              ...state.decisions[state.dialogs.length]
            }])
          }
        }).delay(1000)
      )
    })

  const submitDialogButton$ = fromDelegateEvent(element, '[name="dialogButton"]', 'click')
    .flatMap((event) => {
      const dialogId = event.target.closest('.nrk-dialog').dataset.id
      const index = parseInt(event.target.dataset.index, 10)
      return Observable.merge(
        Observable.of((state) => {
          return {
            ...state,
            dialogs: state.dialogs.map((d) => {
              if (d.id === dialogId) return {...d, value: d.options[index].label, isSent: true}
              return d
            })
          }
        }),
        Observable.of((state) => {
          if (!state.decisions[state.dialogs.length]) return state
          return {
            ...state,
            dialogs: state.dialogs.concat([{
              ...state.decisions[state.dialogs.length]
            }])
          }
        }).delay(1000)
      )
    })

  const deleteDecisionTreeNode$ = fromDelegateEvent(element, '.nrk-decisionTreeNode button[name="delete"]', 'click')
    .map((event) => {
      const id = event.target.closest('.nrk-decisionTreeNode').dataset.id
      return (state) => {
        let dialogs = state.dialogs
        const nodeIds = dialogs.map((m) => m.id)
        if (nodeIds.indexOf(id) > 0) {
          dialogs = dialogs.splice(0, nodeIds.indexOf(id)) // eslint-disable-line
        }
        return {
          ...state,
          dialogs,
          decisions: state.decisions.filter((d) => id !== d.id)
        }
      }
    })

  const initialState = {
    decisions: [],
    dialogs: [],
    newNode: {
      id: shortid.generate(),
      type: 'input',
      name: '',
      text: '',
      value: ''
    }
  }

  const mutation$ = Observable.merge(
    setDialogInput$,
    newDecisionTreeNodeType$,
    newDecisionTreeNodeName$,
    setNodeQuestion$,
    addOption$,
    updateSelectOption$,
    submitDecisionTreeNode$,
    moveDecisionNode$,
    submitDialogInput$,
    submitDialogButton$,
    deleteDecisionTreeNode$
  )

  const state$ = mutation$
    .scan((state, action) => action(state), initialState)
    .startWith(initialState)

  state$.subscribe((state) => console.log(JSON.stringify(state)))

  return state$.map(render)
}
