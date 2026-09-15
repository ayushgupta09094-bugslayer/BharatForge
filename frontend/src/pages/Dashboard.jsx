import React from 'react'


const stats = [
    ["Total Activities", "1000"],
    ["On Track", "870"],
    ["Delayed", "82"],
    ["Needs review", "31"],
]

const Dashboard = () => {
  return (
    <div>
      <h2 className='text-2xl font-semibold'>Dashboard</h2>
      <p className='text-gray-400 mt-2'>Project Execution Overview</p>

        <div className='grid grid-cols-4 gap-4 mt-8'>
            {stats.map(([label, value]) => (
                <div
                key={label}
                className='bg-[#151b24] border border-[#252d38] rounded-xl p-5'
                >
                  <p className='text-gray-400 text-sm'>{label}</p>
                  <p className='text-2xl font-semibold'>{value}</p>
                </div>
            ))}
            </div>

            <div className='mt-8 bg-[#151b24] border border-[#252d38] rounded-xl p-6'>
              <h3 className='text-lg font-semibold'>Project Progress</h3>

              <div className='mt-6'>
                <div className='flex justify-between text-sm'>
                  <span>Planned</span>
                  <span 
                  className='text-gray-400'></span>
                  <span>82%</span>
                </div>
                <div className='h-2 bg-[#252d38] rounded-full mt-2'>
                  <div className='h-2 bg-blue-500 rounded-full w-[82%]'></div>
                </div>
              </div>

              <div className='mt-5'>
                <div className='flex justify-between text-sm'>
                  <span className='text-gray-400'>Actual</span>
                  <span>74%</span>
                </div>
                <div className='h-2 bg-[#252d38] rounded-full mt-2'>
                  <div className='h-2 bg-green-500 rounded-full w-[74%]' />
                </div>
              </div>

            </div>
            <div className='mt-8 bg-[#151b24] border border-[#252d38] rounded-xl p-6'>
              <h3 className="text-lg font-semibold">Critical Activities</h3>
              <div className='mt-5 space-y-3'>
                {[
                  ["A103", "Compressor Foundation", "HIGH", "65%"],
                  ["A221", "Main Piping Installation", "HIGH", "48%"],
                  ["A417", "Electrical Works", "MEDIUM", "72%"],
                ].map(([id, name, risk, progress]) => (
                 <div
                key={id}
                onClick={() => window.location.href = "/activity/A103"}
                className="grid grid-cols-[1fr_750px_80px] items-center p-4 bg-[#10151c] rounded-lg cursor-pointer hover:bg-[#181f28]">
                    <div>
                      <p className='font-medium'>{name}</p>
                       <p className="text-xs text-gray-500 mt-1">{id}</p>
                      </div>
                  <span className="text-sm text-red-400 text-center">{risk}</span>

                  <span className="text-sm text-gray-300">{progress}</span>
                  </div>
                ))}
              </div>
            </div>

    </div>
  )
}

export default Dashboard
