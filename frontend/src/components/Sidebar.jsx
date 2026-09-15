import React from 'react'

const menu = [
    "Dashboard",
    "Projects",
    "Activities",
    "Field Reports",
    "Verification"
]

const Sidebar = () => {
  return (
     <aside className="w-64 min-h-screen bg-[#0b0f14] text-white p-6">
      <h1 className="text-xl font-bold">BharatForge</h1>

      <nav className='space-y-2'>
        {menu.map((item)=> (
            <div 
            key={item}
            className='mt-2 px-4 py-3 rounded-lg text-gray-400 hover:bg-[#151b24] hover:text-white cursor-pointer'
            >
            {item}
            </div>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar
