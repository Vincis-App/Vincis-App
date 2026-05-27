import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

async function test() {
  console.log('Connecting to URL:', supabaseUrl)
  console.log('Listing buckets...')
  try {
    const { data, error } = await supabaseAdmin.storage.listBuckets()
    if (error) {
      console.error('Error listing buckets:', error.message)
    } else {
      console.log('Buckets list:', data)
    }
  } catch (err: any) {
    console.error('Exception:', err.message)
  }
}
test()
