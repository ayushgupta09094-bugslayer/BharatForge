import React from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import ActivityDetails from "./pages/ActivityDetails"


const App = () => {
  return  (
    <div className='flex min-h-screen bg-[#11161d]'>
      <Sidebar />

      <main className='flex-1 p-8 text-white'>
      <h2 className='text-2xl font-semibold'>
        {window.location.pathname === "/activity/A103"
        ? <ActivityDetails />
        : <Dashboard />
}
      </h2>
      </main>
    </div>
  )

}

export default App
