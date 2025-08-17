import Image from "next/image"
import Link from "next/link"

const CTA = () => {
  return (
    <section className="cta-section">
      <div className="cta-badge">Start learning your way</div>
      <h2 className="text-2xl font-bold">
        Build and Personalize Your Learning Companion
      </h2>
      <p>Pick a name, subject, voice, and personality - and start learning through voice conversations and simulations that feel natural and fun</p>
      <Image src="images/cta.svg" alt="cta" width={362} height={232}/>
      <button className="btn-primary">
        <Image src="/icons/plus.svg" alt="plus" width={12} height={12}/>
        <Link href="/companions/new">
          <p>Build a New Companion</p>
        </Link>
      </button>
    </section>
  )
}

export default CTA
