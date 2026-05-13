import { prisma } from '../../lib/prisma.js'
import { supabaseAdmin } from '../../lib/supabase.js'

const bucket = process.env.SUPABASE_BUCKET_EDITAIS || 'editais'

export const editalService = {
  async uploadFile(filePath: string, buffer: Buffer, mimeType: string) {
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

  async createEdital(data: any, studyPlanId: number) {
    return prisma.edital.create({
      data: { ...data, studyPlanId }
    })
  },

  async getById(id: number, studyPlanId: number) {
    return prisma.edital.findFirst({
      where: { id, studyPlanId }
    })
  },
}