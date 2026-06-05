"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import styles from "@modules/linckup/landing.module.css"

import User from "@modules/common/icons/user"

export default function NavClient({ cartButton }: { cartButton?: React.ReactNode }) {
  const [headerState, setHeaderState] = useState<"isTop" | "isUp" | "isDown">("isTop")
  const lastScrollY = useRef(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      if (currentScrollY <= 50) {
        setHeaderState("isTop")
      } else if (currentScrollY > lastScrollY.current) {
        setHeaderState("isDown")
      } else if (currentScrollY < lastScrollY.current) {
        setHeaderState("isUp")
      }
      lastScrollY.current = currentScrollY
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header className={`${styles.stickyHeader} ${styles[headerState]}`}>
      <div className={styles.shell}>
        <nav className={styles.nav} aria-label="Navigation Linckup">
          <Link className={styles.brand} href="/" aria-label="Linckup">
            <Image
              src="/linckup/logo-cropped.png"
              alt="Linckup"
              width={320}
              height={80}
              priority
            />
          </Link>
          <div className={styles.navLinks}>
            <Link href="/#produit">Produit</Link>
            <Link href="/#fonctionnement">Routage</Link>
            <Link href="/#faq">FAQ</Link>
          </div>
          <div className="flex items-center gap-x-6 ml-auto medium:ml-0">
            <Link href="/account" className="hidden small:flex items-center gap-x-2 hover:opacity-70 font-bold" style={{ color: 'var(--ink)' }}>
              Compte
            </Link>
            <Link href="/account" className="hidden small:flex items-center gap-x-2 hover:opacity-70" aria-label="Compte" style={{ color: 'var(--ink)' }}>
              <User size="22" />
            </Link>
            <div className="font-bold" style={{ color: 'var(--ink)' }}>
              {cartButton}
            </div>
          </div>
          <Link className={styles.navCta} href="/store">
            Commander
          </Link>
        </nav>
      </div>
    </header>
  )
}
