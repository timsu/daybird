import { Logo } from './logo'

export function App() {
  return (
    <>
      <Logo />
      <p>SEQUENCE</p>

      <div class="m-12 p-6 max-w-sm mx-auto bg-white rounded-xl shadow-lg flex items-center space-x-4">
        <div>
          <div class="text-xl font-medium text-black">ChitChat</div>
          <p class="text-slate-500">You have a new message!</p>
        </div>
      </div>

      <p>
        <a class="link" href="https://preactjs.com/" target="_blank" rel="noopener noreferrer">
          Learn Preact!
        </a>
      </p>
    </>
  )
}
