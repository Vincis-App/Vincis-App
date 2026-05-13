import { Request, Response, NextFunction } from 'express'
import { AuthenticatedRequest } from '../auth/auth.middleware.js'
import { StudyPlan } from '@prisma/client'
import { studyPlanService } from './study-plan.service.js'

export interface StudyPlanInjectedRequest extends AuthenticatedRequest {
    studyPlan?: StudyPlan
}

export const injectStudyPlan = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const injectedReq = req as StudyPlanInjectedRequest

        // Se houver ID nos params, busca e injeta o study plan
        const studyPlanId = injectedReq.params?.studyPlanId || injectedReq.query?.studyPlanId

        if (studyPlanId && injectedReq.user?.id) {
            const studyPlan = await studyPlanService.getStudyPlanById(
                Number(studyPlanId),
                injectedReq.user.id
            )
            injectedReq.studyPlan = studyPlan || undefined
        }

        return next()
    } catch (error) {
        console.error('Erro ao injetar study plan:', error)
        return res.status(500).json({ message: 'Erro ao processar study plan' })
    }
}

export const requireStudyPlan = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const injectedReq = req as StudyPlanInjectedRequest

    if (!injectedReq.studyPlan) {
        res.status(404).json({ message: 'Plano de estudo não encontrado ou acesso negado.' })
        return
    }

    next()
}

export const validateStudyPlanMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const injectedReq = req as StudyPlanInjectedRequest
    const { studyPlanId } = req.params
    const userId = (injectedReq.user as any)?.id

    if (!userId) {
        return res.status(401).json({ message: 'Usuário não autenticado.' })
    }

    const studyPlan = await studyPlanService.getStudyPlanById(Number(studyPlanId), userId)

    if (!studyPlan) {
        return res.status(404).json({ message: 'Plano de estudo não encontrado.' })
    }

    injectedReq.studyPlan = studyPlan

    return next()
}

