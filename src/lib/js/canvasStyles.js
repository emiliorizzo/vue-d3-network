/**
 *  This styles are used to 'map' svg-css styles to canvas elements
 *  creating svg elements and getting computed styles properties from them
 *
 *  Object keys as style names.
 *  Property '_cssClass', Required, String, css class to pick style
 *  Property '_svgElement', Optional, String type of svg element,
 *  Property '_svgAttrs', Optional,Object, svg element attributes
 *  see supported elements in stylePicker -> canvasPicker()
 *  or add property _svgAttrs to use any svg element
 *
 */
export default {
  background: {
    _cssClass: 'net-svg',
    fillStyle: 'white'
  },
  node: {
    _cssClass: 'node', // name of the class to pick properties
    fillStyle: 'green',
    strokeStyle: 'orange',
    lineWidth: 2
  },
  link: {
    _cssClass: 'link',
    strokeStyle: 'blue',
    lineWidth: 1
  },
  labels: {
    _cssClass: 'node-label',
    _svgElement: 'text', // svg element to pick properties
    fillStyle: 'black',
    fontFamily: 'Arial'
  },
  nodeSelected: {
    _cssClass: 'node selected',
    fillStyle: 'red',
    strokeStyle: 'orange',
    lineWidth: 2
  },
  linkSelected: {
    _cssClass: 'link selected',
    strokeStyle: 'green',
    lineWidth: 2
  },
  nodePinned: {
    _cssClass: 'node pinned',
    fillStyle: 'green',
    strokeStyle: 'red'
  },
  nodeSelectedPinned: {
    _cssClass: 'node selected pinned',
    fillStyle: 'green',
    strokeStyle: 'red'
  }
}
