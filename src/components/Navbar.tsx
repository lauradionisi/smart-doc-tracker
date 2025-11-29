export default function Navbar() {
  return (
    <nav className="w-full h-14 bg-gray-100 border-b flex items-center justify-between px-6">
      <h1 className="font-semibold text-lg">Smart Doc Tracker</h1>
      <div className="flex gap-3">
        <button className="text-sm text-gray-600 hover:text-black">Login</button>
      </div>
    </nav>
  )
}
