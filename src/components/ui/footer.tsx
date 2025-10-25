'use client'

export function Footer() {
  return (
    <footer className="fixed bottom-0 right-0 z-50 p-2">
      <div className="flex items-center gap-2 bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-md px-3 py-1.5 border-l-2 border-blue-500 hover:bg-gray-100/90 dark:hover:bg-gray-700/90 transition-all duration-200">
        <img
          src="/logo_programamos.st.png"
          alt="Programamos.st"
          width={14}
          height={14}
          className="opacity-70"
        />
        <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">
          by
        </span>
        <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
          programamos.st
        </span>
      </div>
    </footer>
  )
}
