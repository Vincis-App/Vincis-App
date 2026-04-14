import { Request, Response, NextFunction } from 'express'
import { supabase } from '../../lib/supabase.js'
import { User } from '@supabase/supabase-js'

export interface AuthenticatedRequest extends Request {
    user?: User
}

export const requireAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // 1. Extrair o token dos cookies
    const accessToken = req.cookies?.access_token

    if (!accessToken) {
        return res.status(401).json({ message: 'Acesso negado: Token não fornecido no cookie.' })
    }

    try {
        // 2. Validar a sessão ativa chamando a verificação do Supabase com o token específico do cliente atual
        // Isso é seguro em ambiente de servidor (não manipula a sessão global do client)
        const { data: { user }, error } = await supabase.auth.getUser(accessToken)

        if (error || !user) {
            return res.status(401).json({ message: 'Não autorizado: Token inválido ou expirado.' })
        }

        // 3. Atribuir o usuário validado à requisição para os próximos módulos
        req.user = user
        return next()
    } catch (err) {
        return res.status(500).json({ message: 'Erro interno ao verificar a autenticação.' })
    }
}
