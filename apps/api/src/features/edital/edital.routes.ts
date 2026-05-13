import { Router } from 'express'
import multer from 'multer'
import { requireAuth } from '../auth/auth.middleware.js'
import { injectStudyPlan, requireStudyPlan } from '../study-plan/study-plan.middleware.js'
import { createEdital, getEditalFileUrl } from './edital.controller.js'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Apenas PDF permitido.'))
    }
    return cb(null, true)
  },
})

export const editalRouter = Router()

editalRouter.post('/', requireAuth, injectStudyPlan, requireStudyPlan, upload.single('file'), createEdital)
editalRouter.get('/:id/file', requireAuth, injectStudyPlan, requireStudyPlan, getEditalFileUrl)