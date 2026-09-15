import React from 'react'

const Projects = () => {
  return (
    <div>
       className={({ isActive }) =>
              `block px-4 py-3 rounded-lg ${
                isActive
                  ? "bg-[#1b2430] text-white"
                  : "text-gray-400 hover:bg-[#151b24] hover:text-white"
              }`
            }
    </div>
  )
}

export default Projects
