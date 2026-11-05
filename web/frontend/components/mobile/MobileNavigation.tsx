"use client";
import Link from "next/link";
export default function MobileNavigation(){return <nav className="mobileNavigation"><Link href="/home">⌂<small>Home</small></Link><Link href="/assistant">☺<small>AI</small></Link><Link href="/learn">▣<small>Learn</small></Link><Link href="/robot">🎮<small>Robot</small></Link><Link href="/code">&lt;/&gt;<small>Code</small></Link></nav>}