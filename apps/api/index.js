import express from 'express'

const PORT = process.env.PORT || 4000
const app = express()

app.get("/", (req, res) => {
    return res.send("oie")
})

app.listen(PORT, () => { console.log("Listening on port: " + PORT)})
