import { redirect } from 'next/navigation'

function page() {
  return redirect('/chat')
}

export default page