export default {
  name: 'pan-zoom',

  props: {
    tag: {
      type: String,
      default: 'g'
    },
    panDisable: {
      type: Boolean
    },
    minZoom: {
      type: Number,
      default: 0.5
    },
    maxZoom: {
      type: Number,
      default: 8
    },
    stepZoom: {
      type: Number,
      default: 0.25
    }
  },

  data () {
    return {
      // Zoom and pan state
      scale: 1,
      dimensions: {
        height: 0,
        width: 0
      },
      pos: {
        x: 0,
        y: 0
      }
    }
  },

  mounted () {
    const parent = this.$parent.$el
    parent.addEventListener('wheel', this.onWheel, false)

    parent.addEventListener('mousedown', this.onDragStart, false)
    parent.addEventListener('mouseup', this.onDragStop, false)
  },

  methods: {

    onWheel (e) {
      e.preventDefault()
      this.refreshDimensions()
      const direction = Math.sign(e.deltaY)
      const scale = this.scale
      this.scale = Math.min(Math.max(this.minZoom, this.scale + (-direction * this.stepZoom)), this.maxZoom)
      // const viewPortCenter = {
      //   x: this.dimensions.left + this.dimensions.width * 0.5,
      //   y: this.dimensions.top + this.dimensions.height * 0.5
      // }
      const scaleDiff = Math.abs(scale - this.scale)
      if (scaleDiff) this.translateBy(direction * this.dimensions.width * 0.5 * scaleDiff, direction * this.dimensions.height * 0.5 * scaleDiff)
    },

    onDragStart (e) {
      if (!this.panDisable) {
        e.preventDefault()
        this._coords = {x: e.clientX, y: e.clientY}
        this.refreshDimensions()
        this.$parent.$el.addEventListener('mousemove', this.onMove, false)
      }
      // this.zoom.scale = Math.min(Math.max(0.5, this.zoom.scale + (e.deltaY / 12)), 8);
    },

    onMove (e) {
      if (!this.panDisable) {
        this.translateBy(e.clientX - this._coords.x, e.clientY - this._coords.y)
        this._coords = {x: e.clientX, y: e.clientY}
      }
    },

    onDragStop () {
      this.$parent.$el.removeEventListener('mousemove', this.onMove, false)
    },

    translateBy (x, y) {
      this.pos = {
        x: this.pos.x + x,
        y: this.pos.y + y
      }
    },

    refreshDimensions () {
      const {height, width, top, left} = this.$parent.$el.getBoundingClientRect()
      this.dimensions = {
        height,
        width,
        top,
        left
      }
    },

    getZoom () {
      return this.scale
    }
  },

  computed: {
    style () {
      const t = 'transform:translate(' + this.pos.x + 'px, ' + this.pos.y + 'px) scale(' + this.scale + ');'
      return t
    }
  },

  render (createElement) {
    return createElement(
      this.tag,   // tag name
      {
        style: this.style
      },
      this.$slots.default // array of children
    )
  }
}
