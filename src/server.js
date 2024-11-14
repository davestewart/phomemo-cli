import Fs, { existsSync, mkdirSync } from 'fs'
import Path from 'path'
import express from 'express'
import multer from 'multer'
import { mergeOptions } from './services/options.js'
import { print } from './services/print.js'

// ---------------------------------------------------------------------------------------------------------------------
// setup
// ---------------------------------------------------------------------------------------------------------------------

export const CACHE_DIR = 'res/cache/'
if (!existsSync(CACHE_DIR)) {
  mkdirSync(CACHE_DIR)
}

function sendError (res, message, status = 400) {
  res.status(status).send({ error: message })
}

// ---------------------------------------------------------------------------------------------------------------------
// server
// ---------------------------------------------------------------------------------------------------------------------

export function serve (port = 4000, characteristic, options = {}) {
  // express
  const app = express()

  // configure uploads
  const storage = multer.memoryStorage() // store files in memory temporarily
  const upload = multer({ storage })

  /**
   * Print submitted file
   */
  app.post('/print', upload.single('image'), async (req, res) => {
    // check file upload
    if (!req.file) {
      return sendError(res, 'No file uploaded')
    }

    // create a temporary file path
    const path = Path.join(CACHE_DIR, req.file.originalname.toLowerCase())

    // cache file
    try {
      Fs.writeFileSync(path, req.file.buffer)
    }
    catch (err) {
      return sendError(res, 'Error caching file')
    }

    // print file
    try {
      const metadata = await print(characteristic, path, mergeOptions(options, req.query))
      res.json(metadata)
    }
    catch (err) {
      sendError(res, err.message)
    }
  })

  // start the server
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`)
  })
}
