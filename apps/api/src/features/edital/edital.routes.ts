import { Router } from 'express'
import multer from 'multer'
import { requireAuth } from '../auth/auth.middleware.js'
import { injectStudyPlan, requireStudyPlan } from '../study-plan/study-plan.middleware.js'
import { createEdital, getEditalFileUrl, getActiveEdital, updateEdital, deleteEdital } from './edital.controller.js'

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
editalRouter.get('/', requireAuth, injectStudyPlan, requireStudyPlan, getActiveEdital)
editalRouter.get('/:id/file', requireAuth, injectStudyPlan, requireStudyPlan, getEditalFileUrl)
editalRouter.patch('/:id', requireAuth, injectStudyPlan, requireStudyPlan, updateEdital)
editalRouter.delete('/:id', requireAuth, injectStudyPlan, requireStudyPlan, deleteEdital)