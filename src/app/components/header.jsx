export default function Header() {
  return (
    <header className='bg-white border-b-2 border-blue-600 shadow-lg'>
      <div className=' mx-auto px-8 py-6 flex justify-between items-center'>
        <div className='flex items-center gap-3 '>
          <div>
            <h1 className='text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent'>
              Apartment Manager
            </h1>
            <p className='text-xs text-gray-500'>
              Portfolio Management Platform
            </p>
          </div>
        </div>
        <nav className='flex gap-1 items-center'>
          <a
            href='/'
            className='px-4 py-2 text-gray-700 hover:text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-all duration-200'>
            Home
          </a>
          <a
            href='/demo'
            className='px-4 py-2 text-gray-700 hover:text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-all duration-200'>
            Demo
          </a>
          <a
            href='/docs'
            className='px-4 py-2 text-gray-700 hover:text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-all duration-200'>
            Docs
          </a>
          <div className='border-l border-gray-300 mx-2 h-6'></div>
          <a
            href='/signup'
            className='px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200'>
            Sign Up / Sign in
          </a>
        </nav>
      </div>
    </header>
  );
}
