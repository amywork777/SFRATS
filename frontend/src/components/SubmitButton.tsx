import { useNavigate } from 'react-router-dom'

function SubmitButton() {
  const navigate = useNavigate()

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    navigate('/submit')
  }

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-6 right-6 z-[9999] bg-blue-500 text-white px-6 py-3 rounded-full 
                shadow-lg hover:bg-blue-600 transition-colors font-medium flex items-center gap-2"
      type="button"
    >
      <span>➕</span>
      Submit Free Stuff
    </button>
  )
}

export default SubmitButton
