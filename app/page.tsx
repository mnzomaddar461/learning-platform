import Hero from './components/Hero'
import Courses from './components/Courses'
import Mission from './components/Mission'
import Link from 'next/link'

export default function Home() {
  return (
    <main>
      <Hero />
      <Courses />
      <Mission />

      {/* Leaderboard CTA */}
      <section className="bg-gray-950 py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-yellow-900/40 border border-yellow-700/50 text-yellow-300 px-4 py-2 rounded-full text-sm mb-6">
            <span>🏆</span><span>লিডারবোর্ড</span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">সেরাদের সাথে প্রতিযোগিতা করো</h2>
          <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
            কোর্স complete করো, মিশনে অংশ নাও, coin/diamond অর্জন করো — শীর্ষে উঠো।
          </p>
          <Link href="/leaderboard"
            className="inline-block bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold px-8 py-3 rounded-xl transition">
            লিডারবোর্ড দেখুন →
          </Link>
        </div>
      </section>
    </main>
  )
}