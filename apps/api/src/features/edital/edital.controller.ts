import crypto from 'node:crypto'
import { Response } from 'express'
import { createEditalSchema } from './edital.schema.js'
import { editalService } from './edital.service.js'
import { StudyPlanInjectedRequest } from '../study-plan/study-plan.middleware.js'

const sanitizeTitle = (name: string) => name.replace(/\\.pdf$/i, '').trim()

export async function createEdital(req: StudyPlanInjectedRequest, res: Response) {
  const file = req.file
  if (!file) return res.status(400).json({ message: 'Arquivo PDF obrigatorio.' })

  const body = createEditalSchema.parse(req.body)
  const studyPlanId = req.studyPlan!.id

  const filePath = `${req.dbUser!.id}/${studyPlanId}/${crypto.randomUUID()}.pdf`

  await editalService.uploadFile(filePath, file.buffer, file.mimetype)

  const edital = await editalService.createEdital(
    {
      title: body.title ?? sanitizeTitle(file.originalname),
      org: body.org ?? null,
      area: body.area ?? null,
      status: body.status ?? 'draft',
      publishDate: body.publishDate ? new Date(body.publishDate) : null,
      deadline: body.deadline ? new Date(body.deadline) : null,
      filePath,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
    },
    studyPlanId
  )

  return res.status(201).json(edital)
}

export async function getEditalFileUrl(req: StudyPlanInjectedRequest, res: Response) {
  const id = Number(req.params.id)
  const edital = await editalService.getById(id, req.studyPlan!.id)
  if (!edital) return res.status(404).json({ message: 'Edital nao encontrado.' })

  const signedUrl = await editalService.createSignedUrl(edital.filePath, 600)
  return res.status(200).json({ url: signedUrl })
}