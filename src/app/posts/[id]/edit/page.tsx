import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import EditPostForm from './EditPostForm'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditPostPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect(`/auth/login?next=/posts/${id}/edit`)

  const { data: post } = await supabase
    .from('posts')
    .select('*, cost_items(*), post_images(*)')
    .eq('id', id)
    .single()

  if (!post) notFound()
  if (post.user_id !== session.user.id) redirect(`/posts/${id}`)

  return <EditPostForm post={post} />
}
