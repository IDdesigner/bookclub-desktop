import AuthForm from '../components/auth/AuthForm';

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Book Club</h1>
        <p className="text-gray-600 mb-8">Teacher Portal</p>
        <AuthForm />
      </div>
    </div>
  );
}
