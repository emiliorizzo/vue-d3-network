
const pkg = require('./package.json')
module.exports = {
  publicPath: '',
  chainWebpack: config => {
    config
      .plugin('define')
      .tap(args => {
        args[0]['process.env'] = Object.assign(args[0]['process.env'], {
          APP: {
            name: JSON.stringify(pkg.name),
            des: JSON.stringify(pkg.description),
            version: JSON.stringify(pkg.version),
            repo: JSON.stringify(pkg.repository.url)
          }
        })
        return args
      })
    const svgRule = config.module.rule('svg')

    svgRule.uses.clear()

    svgRule
      .oneOf('inline')
      .resourceQuery(/inline/)
      .use('vue-svg-loader')
      .loader('vue-svg-loader')
      .end()
      .resourceQuery(/raw/)
      .use('vue-svg-loader')
      .loader('raw-loader')
      .end()
      .end()
      .oneOf('external')
      .use('file-loader')
      .loader('file-loader')
      .options({
        name: 'assets/[name].[hash:8].[ext]'
      })
  }
}
