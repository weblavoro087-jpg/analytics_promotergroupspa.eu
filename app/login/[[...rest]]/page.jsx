import { SignIn } from '@clerk/nextjs';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-2xl shadow-2xl">
        <SignIn
          routing="path"
          path="/login"
          signUpUrl="/login"
          forceRedirectUrl="/dashboard/page-1"
        />
      </div>
    </div>
  );
}
