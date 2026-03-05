import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://postukfiqnwvfowkxzjv.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvc3R1a2ZpcW53dmZvd2t4emp2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTI2NDA5NywiZXhwIjoyMDg2ODQwMDk3fQ.i9vfBFlgRoM-3OUQjcWz0FYGBO69dj6QyDsv-wNeZts'
const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
    const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('id', '7365f7f6-f2ac-4335-8d58-ef6be8fd98ee')
        .single()

    console.log("DATA:", data)
    console.log("ERROR:", error)
}
test()
