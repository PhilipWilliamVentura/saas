import Link from "next/link"
import Image from "next/image"
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs"
import Navitems from "./Navitems"

const Navbar = () => {
  return (
    <nav className="navbar">
      <Link href="/">
        <div className="flex items-center gap-2.5 px-3 py-5 cursor-pointer">
            <Image src="/images/logo.svg" alt="logo" width={62} height={50}/>
            <h1 className="px-3">Quant ML Labs</h1>
        </div>
      </Link>
      <div className="flex items-center gap-8">
        <Navitems />
        <SignedOut>
          <SignInButton>
            <button className="btn-signin">Sign In</button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </div>
    </nav>
  )
}

export default Navbar
