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

        if (studyPlanId && injectedReq.dbUser?.id) {
            const studyPlan = await studyPlanService.getStudyPlanById(
                Number(studyPlanId),
                injectedReq.dbUser.id
            )
            injectedReq.studyPlan = studyPlan || undefined
        }

        next()
        return
    } catch (error) {
        console.error('Erro ao injetar study plan:', error)
        res.status(500).json({ message: 'Erro ao processar study plan' })
        return
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
    const userId = injectedReq.dbUser?.id

    if (!userId) {
        res.status(401).json({ message: 'Usuário não autenticado.' })
        return
    }

    const studyPlan = await studyPlanService.getStudyPlanById(Number(studyPlanId), userId)

    if (!studyPlan) {
        res.status(404).json({ message: 'Plano de estudo não encontrado.' })
        return
    }

    injectedReq.studyPlan = studyPlan

    next()
    return
}

