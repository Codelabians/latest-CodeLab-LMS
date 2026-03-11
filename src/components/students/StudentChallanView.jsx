import React from 'react'
import { useGetQuery } from '../../api/apiSlice'

const StudentChallanView = () => {
  
    const{Data : students} = useGetQuery({
        path : "admin/students"
    })

  return (
    <div>
      
    </div>
  )
}

export default StudentChallanView
