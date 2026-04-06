import express, { Request, Response } from 'express'

const PORT = Number(process.env.PORT) || 4000
const app = express()

app.get('/', (_req: Request, res: Response) => {
  return res.send('oie')
})

app.get('/status', (_req: Request, res: Response) => {
  return res.send('tamo on e roteando')
})

app.listen(PORT, () => {
  console.log('Listening on port: ' + PORT)
})