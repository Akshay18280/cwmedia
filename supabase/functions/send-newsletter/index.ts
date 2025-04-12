// supabase/functions/send-newsletter/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  const body = await req.json()
  const { post } = body

  if (!post || !post.title || !post.content) {
    return new Response("Invalid post data", { status: 400 })
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  )

  const { data: subscribers, error } = await supabase
    .from("subscriptions")
    .select("email")

  if (error) {
    console.error("Error fetching subscribers:", error)
    return new Response("Error fetching subscribers", { status: 500 })
  }
  for (const sub of subscribers || []) {
    console.log(`Would send email to: ${sub.email}`)
  }
  
  return new Response("Emails sent", { status: 200 })
})
