import { createClient } from '@/lib/server'
import { redirect } from 'next/navigation'
import { AvatarCreator } from '@/components/avatar/avatar-creator'

export default async function AvatarPage() {
  const { data: { user } } = await .auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Get active avatar
  const { data: avatar } = await 
    .from('avatars')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  return (
    <div className="space-y-6">
      <h1 className="font-[family-name:var(--font-pixel)] text-2xl text-foreground">
        AVATAR CREATOR
      </h1>
      <AvatarCreator initialAvatar={avatar} userId={user.id} />
    </div>
  )
}
