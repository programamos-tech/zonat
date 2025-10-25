'use client'

export function Footer() {
  return (
    <footer className="fixed bottom-0 right-0 z-50 p-3">
      <div className="flex items-center gap-2 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg border border-gray-200/60 dark:border-gray-700/60 hover:shadow-xl transition-all duration-200">
        <div className="flex items-center gap-2">
          <img
            src="/programamos.st.logo.png"
            alt="Programamos.st"
            width={18}
            height={18}
            className="opacity-80"
          />
          <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
            Mantenido por
          </span>
          <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
            programamos.st
          </span>
        </div>
      </div>
    </footer>
  )
}
