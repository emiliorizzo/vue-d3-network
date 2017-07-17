// find links by node => [ links ] | null
export const findLinks = (nodeId, links) => {
  let nodeLinks = []
  for (let link of links) {
    if (link.sid === nodeId || link.tid === nodeId) nodeLinks.push(link)
  }
  return (nodeLinks.length) ? nodeLinks : null
}
export const findNode = (nodes, nodeId) => {
  let index = nodeExists(nodeId)
  if (index) {
    return nodes[index]
  }
  return null
}
// removes node by id => () => ( [newNodes] )
export const removeNode = (nodeId, nodes, cb) => {
  let index = nodes.findIndex(
    (node) => { return node.id === nodeId }
  )
  if (index > -1) {
    nodes.splice(index, 1)
    cb(nodes)
  } else {
    cb(null)
  }
}

// removes orphaned links => { newLinks, removed }
export const rebuildLinks = (nodes, links) => {
  let newLinks = []
  let removed = []
  for (let link of links) {
    if (nodeExists(link.sid, nodes) && nodeExists(link.tid, nodes)) {
      newLinks.push(link)
    } else {
      removed.push(link)
    }
  }
  return { newLinks, removed }
}

// removes unlinked nodes => [ newNodes ]
export const rebuildNodes = (links, nodes) => {
  let newNodes = []
  for (let node of nodes) {
    if (isLinked(node.id, links)) {
      newNodes.push(node)
    }
  }
  return newNodes
}

// finds node by id => boolean
export const nodeExists = (nodeId, nodes) => {
  let index = nodes.findIndex(
    (node) => { return node.id === nodeId }
  )
  return (index > -1)
}

// Checks if node is linked => boolean
const isLinked = (nodeId, links) => {
  let index = links.findIndex(
    (link) => { return (link.tid === nodeId || link.sid === nodeId) }
  )
  return (index > -1)
}

// link formatter
export const newLink = (id, sid, tid) => {
  return { id, sid, tid }
}

// generates random links => [ links ]
export const makeRandomLinks = (nodes, maxLinks) => {
  let links = []
  let id = 0
  for (let node of nodes) {
    let total = Math.floor(Math.random() * maxLinks)
    for (let i = 0; i <= total; i++) {
      let target = Math.floor(Math.random() * nodes.length)
      let source = node.id
      id++
      links.push(newLink(id, source, target))
    }
  }
  return links
}

// random node name
const newNodeName = () => {
  return Math.random().toString(36).substring(7)
}

// node formatter
export const newNode = (nodeId) => {
  return { id: nodeId, name: newNodeName() }
}

// generates random nodes => [ nodes ]
export const makeRandomNodes = (maxNodes) => {
  let nodes = Array.apply(null, { length: maxNodes })
    .map((value, index) => { return newNode(index) })
  return nodes
}

// vue custom event handler
export const methodCall = (vm, action, args) => {
  let method = vm[action]
  if (typeof method === 'function') {
    if (args) method(...args)
    else method()
  } else {
    console.error('Call to undefined method:', action)
  }
}

// vue event wrapper
export const emitEvent = (vm, action, args) => {
  if (vm.$data.conf && vm.$data.conf.allEventsAs) {
    let evName = vm.$data.conf.allEventsAs
    return vm.$emit(evName, action, args)
  }
  return vm.$emit(action, ...args)
}
