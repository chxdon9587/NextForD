export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <main className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">
            Welcome to <span className="text-primary-600">4D</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Milestone-based crowdfunding for 3D printing projects
          </p>
          <div className="flex justify-center gap-4">
            <button className="bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition">
              Explore Projects
            </button>
            <button className="border-2 border-primary-600 text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-primary-50 transition">
              Start a Project
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
