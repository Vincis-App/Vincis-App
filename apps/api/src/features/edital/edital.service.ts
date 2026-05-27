import { Prisma } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'
import { supabaseAdmin } from '../../lib/supabase.js'

const bucket = process.env.SUPABASE_BUCKET_EDITAIS || 'editais'

export const editalService = {
  async uploadFile(filePath: string, buffer: Buffer, mimeType: string) {
    // Proactively check/create bucket
    try {
      const { data: buckets } = await supabaseAdmin.storage.listBuckets()
      const bucketExists = buckets?.some(b => b.id === bucket)
      if (!bucketExists) {
        const { error: createError } = await supabaseAdmin.storage.createBucket(bucket, {
          public: false
        })
        if (createError) {
          console.error(`Falha ao criar bucket ${bucket}:`, createError.message)
        }
      }
    } catch (bucketErr: any) {
      console.warn('Erro ao verificar/criar bucket:', bucketErr.message)
    }

    const { error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(filePath, buffer, { contentType: mimeType, upsert: false })

    if (error) throw new Error(error.message)
    return filePath
  },

  async removeFile(filePath: string) {
    await supabaseAdmin.storage.from(bucket).remove([filePath])
  },

  async createSignedUrl(filePath: string, seconds = 600) {
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUrl(filePath, seconds)

    if (error) throw new Error(error.message)
    return data.signedUrl
  },

  async createEdital(data: Omit<Prisma.EditalUncheckedCreateInput, 'studyPlanId'>, studyPlanId: number) {
    return prisma.edital.create({
      data: { ...data, studyPlanId }
    })
  },

  async getById(id: number, studyPlanId: number) {
    return prisma.edital.findFirst({
      where: { id, studyPlanId }
    })
  },

  async updateEdital(id: number, studyPlanId: number, data: Partial<Prisma.EditalUpdateInput>) {
    const edital = await prisma.edital.findFirst({
      where: { id, studyPlanId }
    })
    if (!edital) return null
    return prisma.edital.update({
      where: { id },
      data
    })
  },

  async deleteEdital(id: number, studyPlanId: number) {
    const edital = await prisma.edital.findFirst({
      where: { id, studyPlanId }
    })
    if (!edital) return null

    // Delete file from Supabase Storage
    await editalService.removeFile(edital.filePath)

    // Delete record from Prisma DB
    return prisma.edital.delete({
      where: { id }
    })
  },
}