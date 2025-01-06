import React from 'react'

export default function Header({ title }: { title: string }) {
  return (
    <div className="sticky top-0 bg-white z-10 border-b px-4 py-3">
      <h1 className="text-xl font-bold">{title}</h1>
    </div>
  )
} 