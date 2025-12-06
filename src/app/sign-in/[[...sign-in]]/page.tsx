import { SignIn } from '@clerk/nextjs'

export default function Page() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <SignIn />
        </div>
    )
}
