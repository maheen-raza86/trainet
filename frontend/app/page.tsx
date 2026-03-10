export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Welcome to TRAINET
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Your Learning & Career Development Platform
          </p>
          <div className="flex gap-4 justify-center">
            <a
              href="/login"
              className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition"
            >
              Login
            </a>
            <a
              href="/signup"
              className="px-6 py-3 bg-secondary-500 text-white rounded-lg hover:bg-secondary-600 transition"
            >
              Sign Up
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
