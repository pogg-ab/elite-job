const http = require('http')
const next = require('next')

const port = parseInt(process.env.PORT || '3000', 10)
const host = '0.0.0.0'
const app = next({ dev: false, hostname: host, port })
const handle = app.getRequestHandler()

app
  .prepare()
  .then(() => {
    http
      .createServer((req, res) => {
        handle(req, res)
      })
      .listen(port, host, () => {
        console.log(`Frontend running on ${host}:${port}`)
      })
  })
  .catch((err) => {
    console.error('Frontend startup failed:', err)
    process.exit(1)
  })
