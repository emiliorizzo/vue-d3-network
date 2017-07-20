export default {
  save (img, name) {
    if (img) {
      img = this.dataURIToBlob(img, (blob) => {
        let url = URL.createObjectURL(blob)
        this.download(url, name)
      })
    }
  },
  dataURIToBlob (dataURI, cb) {
    let binStr = atob(dataURI.split(',')[1])
    let len = binStr.length
    let arr = new Uint8Array(len)
    for (var i = 0; i < len; i++) {
      arr[i] = binStr.charCodeAt(i)
    }
    cb(new Blob([arr]))
  },
  download (url, name) {
    name = name || ''
    let link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', name)
    let el = document.body.appendChild(link)
    link.click()
    document.body.removeChild(el)
  }
}
