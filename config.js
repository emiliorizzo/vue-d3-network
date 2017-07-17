var path = require('path')
var pkg = require("./package.json")
module.exports = {
  html: {
    title: pkg.name,
    des: pkg.description,
    template: path.join(__dirname, './src/example/template.html'),
  },
  webpack (webpackConfig, options, webpack) {
    webpackConfig.plugins.push(new webpack.DefinePlugin({
      APP: {
        name: JSON.stringify(pkg.name),
        des: JSON.stringify(pkg.description),
        version: JSON.stringify(pkg.version),
        repo: JSON.stringify(pkg.repository.url)
      }
    }))
    webpackConfig.output.publicPath = ""
    return webpackConfig
  }
}
