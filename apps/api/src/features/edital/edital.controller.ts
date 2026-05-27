import crypto from 'node:crypto'
import { Response } from 'express'
import { createEditalSchema, updateEditalSchema } from './edital.schema.js'
import { editalService } from './edital.service.js'
import { StudyPlanInjectedRequest } from '../study-plan/study-plan.middleware.js'
import { prisma } from '../../lib/prisma.js'

const sanitizeTitle = (name: string) => name.replace(/\.pdf$/i, '').trim()

export async function createEdital(req: StudyPlanInjectedRequest, res: Response) {
  try {
    const file = req.file
    if (!file) return res.status(400).json({ message: 'Arquivo PDF obrigatorio.' })

    // Validate PDF magic bytes: %PDF
    const isPdf = file.buffer.length >= 4 &&
                  file.buffer[0] === 0x25 &&
                  file.buffer[1] === 0x50 &&
                  file.buffer[2] === 0x44 &&
                  file.buffer[3] === 0x46;
    if (!isPdf) {
      return res.status(400).json({ message: 'O arquivo enviado nao e um PDF valido.' })
    }

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
        userId: req.dbUser!.id,
      },
      studyPlanId
    )

    return res.status(201).json(edital)
  } catch (error: any) {
    console.error('Erro ao criar edital:', error)
    return res.status(500).json({ message: error.message || 'Erro interno ao criar edital.' })
  }
}

export async function getEditalFileUrl(req: StudyPlanInjectedRequest, res: Response) {
  try {
    const id = Number(req.params.id)
    const edital = await editalService.getById(id, req.studyPlan!.id)
    if (!edital) return res.status(404).json({ message: 'Edital nao encontrado.' })

    const signedUrl = await editalService.createSignedUrl(edital.filePath, 600)
    return res.status(200).json({ url: signedUrl })
  } catch (error: any) {
    console.error('Erro ao buscar URL do edital:', error)
    return res.status(500).json({ message: error.message || 'Erro interno ao buscar URL do edital.' })
  }
}

export async function getActiveEdital(req: StudyPlanInjectedRequest, res: Response) {
  try {
    const studyPlanId = req.studyPlan!.id
    const edital = await prisma.edital.findFirst({
      where: { studyPlanId },
      orderBy: { createdAt: 'desc' }
    })

    if (!edital) {
      return res.status(200).json(null)
    }

    const signedUrl = await editalService.createSignedUrl(edital.filePath, 600)

    return res.status(200).json({
      ...edital,
      url: signedUrl
    })
  } catch (error: any) {
    console.error('Erro ao buscar edital ativo:', error)
    return res.status(500).json({ message: error.message || 'Erro interno ao buscar edital.' })
  }
}

export async function updateEdital(req: StudyPlanInjectedRequest, res: Response) {
  try {
    const id = Number(req.params.id)
    const body = updateEditalSchema.parse(req.body)

    const updateData: any = {}
    if (body.title !== undefined) updateData.title = body.title
    if (body.org !== undefined) updateData.org = body.org
    if (body.area !== undefined) updateData.area = body.area
    if (body.status !== undefined) updateData.status = body.status
    if (body.publishDate !== undefined) updateData.publishDate = body.publishDate ? new Date(body.publishDate) : null
    if (body.deadline !== undefined) updateData.deadline = body.deadline ? new Date(body.deadline) : null

    const edital = await editalService.updateEdital(id, req.studyPlan!.id, updateData)
    if (!edital) {
      return res.status(404).json({ message: 'Edital nao encontrado ou nao pertence ao plano ativo.' })
    }

    return res.status(200).json(edital)
  } catch (error: any) {
    console.error('Erro ao atualizar edital:', error)
    return res.status(500).json({ message: error.message || 'Erro interno ao atualizar edital.' })
  }
}

export async function deleteEdital(req: StudyPlanInjectedRequest, res: Response) {
  try {
    const id = Number(req.params.id)
    const edital = await editalService.deleteEdital(id, req.studyPlan!.id)
    if (!edital) {
      return res.status(404).json({ message: 'Edital nao encontrado ou nao pertence ao plano ativo.' })
    }
    return res.status(200).json({ message: 'Edital excluido com sucesso.' })
  } catch (error: any) {
    console.error('Erro ao excluir edital:', error)
    return res.status(500).json({ message: error.message || 'Erro interno ao excluir edital.' })
  }
}