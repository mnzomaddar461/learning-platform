import Hero from './components/Hero'
import Courses from './components/Courses'
import Mission from './components/Mission'
import Leaderboard from './components/Leaderboard'

export default function Home() {
  return (
    <main>
      <Hero />
      <Courses />
      <Mission />
      <Leaderboard />
    </main>
  )
}