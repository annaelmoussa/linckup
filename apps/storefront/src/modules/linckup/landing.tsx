"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"
import styles from "./landing.module.css"

gsap.registerPlugin(ScrollTrigger)

const reviews = [
  {
    name: "Maison Leone",
    text: "La plaque est devenue un réflexe en caisse. Les clients comprennent tout de suite quoi faire.",
  },
  {
    name: "Atelier Saint-Martin",
    text: "On récupère plus d'avis sans relancer les clients par SMS ni former toute l'équipe.",
  },
  {
    name: "Bloom Coffee",
    text: "Le QR rassure, mais le NFC va beaucoup plus vite au moment du paiement.",
  },
  {
    name: "Hotel des Arts",
    text: "Les visiteurs étrangers partent au bon endroit, sans qu'on ait à expliquer TripAdvisor.",
  },
  {
    name: "Barber Club",
    text: "Le produit est visible sur le comptoir et donne envie de laisser un avis tout de suite.",
  },
  {
    name: "Agence Rive Gauche",
    text: "Enfin un support physique qui reste pilotable après l'installation.",
  },
  {
    name: "Boutique Celeste",
    text: "Une app légère, simple et extrêmement efficace pour notre boutique.",
  },
  {
    name: "Le Bistrot de Jean",
    text: "Vraiment une belle initiative. Ça facilite grandement la récolte d'avis.",
  },
  {
    name: "Salon Elegance",
    text: "Très pratique pour capter les avis clients avant qu'ils ne sortent du salon.",
  },
  {
    name: "Studio Photo Paris",
    text: "Enfin le retour à la simplicité ! Un scan et le tour est joué.",
  },
  {
    name: "Librairie Page 9",
    text: "Parfait pour diriger nos clients internationaux vers la bonne plateforme.",
  },
  {
    name: "Garage Auto Max",
    text: "Compte créé et plaque installée en 5 minutes. Super expérience.",
  },
]

const steps = [
  {
    title: "Prête en 3 secondes",
    text: "Vous recevez votre plaque prête à poser. Mettez-la sur le comptoir pour commencer à récolter des avis.",
  },
  {
    title: "Destination personnalisable",
    text: "Modifiez l'URL de redirection par défaut pour envoyer vos clients vers la plateforme de votre choix.",
  },
  {
    title: "NFC et QR Code",
    text: "La seule plaque qui accepte aussi bien le sans-contact que le scan classique, permettant à tout le monde de participer.",
  },
  {
    title: "Collecte instantanée",
    text: "Au moment du paiement ou à la fin de la visite, le client donne son avis en un éclair.",
  },
  {
    title: "Pilotage 100% à distance",
    text: "Dashboard complètement gratuit, sans aucune commission. Modifiez les réglages à distance sans changer la plaque.",
  },
  {
    title: "Leader de la conversion",
    text: "Avec des milliers de plaques actives, Linckup aide les commerçants à exploser leur référencement local.",
  },
]

const faqs = [
  {
    question: "Est-ce que le client doit installer une application ?",
    answer: "Non. Le NFC ou le QR code ouvre directement le navigateur du téléphone.",
  },
  {
    question: "Le produit fonctionne si le NFC ne marche pas ?",
    answer: "Oui. La plaque garde un QR code lisible pour les téléphones plus anciens.",
  },
  {
    question: "Puis-je changer la destination après livraison ?",
    answer: "Oui. Le tag pointe vers Linckup, donc la destination se pilote sans reprogrammer la plaque.",
  },
  {
    question: "Pourquoi utiliser Google et TripAdvisor ?",
    answer: "Google rassure les locaux. TripAdvisor parle davantage aux touristes et aux visiteurs étrangers.",
  },
  {
    question: "Combien coûte le pack Linckup ?",
    answer: "Le positionnement de départ est un support physique à 25 €, puis 29 € par mois pour le routage intelligent et le dashboard.",
  },
]

export default function LinckupLanding() {
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

  const productRef = useRef<HTMLDivElement>(null)
  const col1Ref = useRef<HTMLDivElement>(null)
  const col2Ref = useRef<HTMLDivElement>(null)
  const col3Ref = useRef<HTMLDivElement>(null)

  const heroRef = useRef<HTMLDivElement>(null)
  const heroCopyRef = useRef<HTMLDivElement>(null)
  const featureRefs = useRef<(HTMLDivElement | null)[]>([])
  const stepsRef = useRef<HTMLDivElement>(null)
  const faqRef = useRef<HTMLDivElement>(null)
  const finalShowcaseRef = useRef<HTMLDivElement>(null)
  const massiveTitleRef = useRef<HTMLDivElement>(null)
  const widePanelRef = useRef<HTMLDivElement>(null)

  const addToFeatureRefs = (el: HTMLDivElement | null) => {
    if (el && !featureRefs.current.includes(el)) {
      featureRefs.current.push(el)
    }
  }

  useGSAP(() => {
    // 1. Hero Entrance Animation
    const tl = gsap.timeline()
    
    // Animate children of heroCopyRef (h1, p, buttons)
    if (heroCopyRef.current) {
      tl.fromTo(
        heroCopyRef.current.children,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.15, duration: 0.8, ease: "power3.out" }
      )
    }

    // Animate the hero product image
    if (productRef.current) {
      tl.fromTo(
        productRef.current,
        { scale: 0.9, opacity: 0, y: 50 },
        { scale: 1, opacity: 1, y: 0, duration: 1, ease: "power3.out" },
        "-=0.6"
      )
    }

    // Product Parallax
    gsap.to(productRef.current, {
      y: -150,
      ease: "none",
      scrollTrigger: {
        trigger: heroRef.current,
        start: "top top",
        end: "bottom top",
        scrub: 1,
      },
    })

    // Feature Sections (Text + Image splits) Scroll Animations
    featureRefs.current.forEach((section) => {
      gsap.fromTo(
        section,
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: section,
            start: "top 85%", // Trigger when top of section hits 85% down viewport
            toggleActions: "play none none reverse", // Play forward on enter, reverse on leave back
          },
        }
      )
    })

    // Massive Title Animation
    if (massiveTitleRef.current) {
      gsap.fromTo(
        massiveTitleRef.current.children,
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: massiveTitleRef.current,
            start: "top 85%",
          },
        }
      )
    }

    // Steps Grid Animation (Staggered)
    if (stepsRef.current) {
      gsap.fromTo(
        stepsRef.current.children,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: stepsRef.current,
            start: "top 85%",
          },
        }
      )
    }

    // Wide Panel Animation
    if (widePanelRef.current) {
      gsap.fromTo(
        widePanelRef.current,
        { y: 40, opacity: 0, scale: 0.95 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: widePanelRef.current,
            start: "top 85%",
          },
        }
      )
    }

    // FAQ Animation (Staggered)
    if (faqRef.current) {
      gsap.fromTo(
        faqRef.current.children,
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.4,
          stagger: 0.05,
          ease: "power2.out",
          scrollTrigger: {
            trigger: faqRef.current,
            start: "top 90%",
          },
        }
      )
    }

    // Final Showcase Animation
    if (finalShowcaseRef.current) {
      gsap.fromTo(
        finalShowcaseRef.current,
        { y: 40, opacity: 0, scale: 0.98 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: finalShowcaseRef.current,
            start: "top 85%",
          },
        }
      )
    }

    // Infinite Marquee for Reviews
    const animateColumn = (ref: React.RefObject<HTMLDivElement | null>, direction: "up" | "down", speed: number) => {
      if (!ref.current) return
      const inner = ref.current.children[0]
      if (direction === "up") {
        gsap.to(inner, {
          yPercent: -25, // 4 groups, moving 1 group is 25% of total height
          ease: "none",
          duration: speed,
          repeat: -1,
        })
      } else {
        gsap.set(inner, { yPercent: -25 })
        gsap.to(inner, {
          yPercent: 0,
          ease: "none",
          duration: speed,
          repeat: -1,
        })
      }
    }

    animateColumn(col1Ref, "up", 25)
    animateColumn(col2Ref, "down", 35)
    animateColumn(col3Ref, "up", 30)
  })

  const col1 = reviews.slice(0, 4)
  const col2 = reviews.slice(4, 8)
  const col3 = reviews.slice(8, 12)

  const ReviewGroup = ({ groupReviews }: { groupReviews: typeof reviews }) => (
    <div className={styles.reviewGroup}>
      {groupReviews.map((review, i) => (
        <article className={styles.reviewCard} key={i}>
          <div className={styles.reviewHeader}>
            <span className={styles.reviewName}>{review.name}</span>
            <div className={styles.stars}>★★★★★</div>
          </div>
          <p>{review.text}</p>
        </article>
      ))}
    </div>
  )

  const handlePhotoMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5

    const img = e.currentTarget.querySelector("img")
    if (img) {
      gsap.to(img, {
        x: x * 40,
        y: y * 40,
        ease: "power2.out",
        duration: 0.6
      })
    }
  }

  const handlePhotoMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const img = e.currentTarget.querySelector("img")
    if (img) {
      gsap.to(img, {
        x: 0,
        y: 0,
        ease: "power2.out",
        duration: 0.8
      })
    }
  }

  return (
    <main className={styles.page}>
      <header className={`${styles.stickyHeader} ${styles[headerState]}`}>
        <div className={styles.shell}>
          <nav className={styles.nav} aria-label="Navigation Linckup">
            <a className={styles.brand} href="#top" aria-label="Linckup">
              <Image
                src="/linckup/logo-cropped.png"
                alt="Linckup"
                width={320}
                height={80}
                priority
              />
            </a>
            <div className={styles.navLinks}>
              <a href="#produit">Produit</a>
              <a href="#fonctionnement">Routage</a>
              <Link href="/dashboard">Dashboard</Link>
              <a href="#faq">FAQ</a>
            </div>
            <a className={styles.navCta} href="#commander">
              Commander
            </a>
          </nav>
        </div>
      </header>

      <section className={styles.hero} id="top">
        <div className={styles.shell}>
          <div className={styles.heroContainer} ref={heroRef}>
            <div className={styles.heroShowcase}>
              <div className={styles.heroCopy} ref={heroCopyRef}>
                <h1>Souvent scannée, jamais oubliée.</h1>
                <p>
                  Linckup aide les commerces à transformer un client satisfait en
                  avis visible, sans application à installer : une plaque sur le
                  comptoir, un scan, puis le bon parcours vers la plateforme de votre choix (
                  <span className={styles.inlineLogos}>
                    <span className={styles.tooltipWrap} data-tooltip="Google">
                      <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/></svg>
                    </span>
                    <span className={styles.tooltipWrap} data-tooltip="TripAdvisor">
                      <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12.006 4.295c-2.67 0-5.338.784-7.645 2.353H0l1.963 2.135a5.997 5.997 0 0 0 4.04 10.43 5.976 5.976 0 0 0 4.075-1.6L12 19.705l1.922-2.09a5.972 5.972 0 0 0 4.072 1.598 6 6 0 0 0 6-5.998 5.982 5.982 0 0 0-1.957-4.432L24 6.648h-4.35a13.573 13.573 0 0 0-7.644-2.353zM12 6.255c1.531 0 3.063.303 4.504.903C13.943 8.138 12 10.43 12 13.1c0-2.671-1.942-4.962-4.504-5.942A11.72 11.72 0 0 1 12 6.256zM6.002 9.157a4.059 4.059 0 1 1 0 8.118 4.059 4.059 0 0 1 0-8.118zm11.992.002a4.057 4.057 0 1 1 .003 8.115 4.057 4.057 0 0 1-.003-8.115zm-11.992 1.93a2.128 2.128 0 0 0 0 4.256 2.128 2.128 0 0 0 0-4.256zm11.992 0a2.128 2.128 0 0 0 0 4.256 2.128 2.128 0 0 0 0-4.256z"/></svg>
                    </span>
                    <span className={styles.tooltipWrap} data-tooltip="Trustpilot">
                      <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M17.227 16.67l2.19 6.742-7.413-5.388 5.223-1.354zM24 9.31h-9.165L12.005.589l-2.84 8.723L0 9.3l7.422 5.397-2.84 8.714 7.422-5.388 4.583-3.326L24 9.311z"/></svg>
                    </span>
                    <span className={styles.etcText}>etc...</span>
                  </span>
                  ).
                </p>
                <div className={styles.heroActions}>
                <a className={styles.primaryCta} href="#commander">
                  Commander le pack
                </a>
                  <a className={styles.secondaryCta} href="#fonctionnement">
                    Voir comment ça marche
                  </a>
                </div>
              </div>
            </div>
            <div className={styles.heroProduct} aria-label="Pack Linckup" ref={productRef}>
              <Image
                className={styles.mainProduct}
                src="/linckup/product-plaque-nobg.png"
                alt="Plaque NFC Linckup pour avis Google"
                width={900}
                height={900}
                priority
              />
            </div>
          </div>
        </div>
      </section>

      <section className={styles.reviews} aria-label="Retours commerçants">
        <div className={styles.shell}>
          <div className={styles.reviewGrid}>
            <div className={styles.reviewColumn} ref={col1Ref}>
              <div className={styles.reviewTrack}>
                <ReviewGroup groupReviews={col1} />
                <ReviewGroup groupReviews={col1} />
                <ReviewGroup groupReviews={col1} />
                <ReviewGroup groupReviews={col1} />
              </div>
            </div>
            <div className={styles.reviewColumn} ref={col2Ref}>
              <div className={styles.reviewTrack}>
                <ReviewGroup groupReviews={col2} />
                <ReviewGroup groupReviews={col2} />
                <ReviewGroup groupReviews={col2} />
                <ReviewGroup groupReviews={col2} />
              </div>
            </div>
            <div className={styles.reviewColumn} ref={col3Ref}>
              <div className={styles.reviewTrack}>
                <ReviewGroup groupReviews={col3} />
                <ReviewGroup groupReviews={col3} />
                <ReviewGroup groupReviews={col3} />
                <ReviewGroup groupReviews={col3} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.paleBand} id="produit">
        <div className={styles.shell}>
          <div className={styles.split} ref={addToFeatureRefs}>
            <div 
              className={styles.photoFrame}
              onMouseMove={handlePhotoMouseMove}
              onMouseLeave={handlePhotoMouseLeave}
            >
              <Image
                src="/linckup/checkout-scene.png"
                alt="Plaque Linckup posée sur un comptoir avec scan téléphone"
                width={1536}
                height={1024}
                style={{ transform: 'scale(1.08)' }}
              />
            </div>
            <div className={styles.sectionCopy}>
              <h2 className={styles.mixedTitle}>
                <span className={styles.highlight}>Un objet visible et simple,</span><br/>
                qui pousse à l&apos;action.
              </h2>
              <p>
                <strong>Sans application.</strong> Le client scanne ou approche son<br/>
                téléphone et atterrit directement sur votre page Google.
              </p>
              <a href="#produit" className={styles.learnMore}>En savoir plus</a>
              <div className={styles.badges}>
                <span>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M7 8.5c2.67-2.67 7.33-2.67 10 0"/><path d="M9.5 11c1.33-1.33 3.67-1.33 5 0"/><path d="M12 13.5v.01"/></svg>
                  Sans contact
                </span>
                <span>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
                  QR Code
                </span>
                <span className={styles.primaryBadge}>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                  Avis Google
                </span>
              </div>
            </div>
          </div>

          <div className={styles.splitReverse} ref={addToFeatureRefs}>
            <div className={styles.sectionCopy}>
              <h2 className={styles.mixedTitle}>
                <span className={styles.highlight}>Le SaaS travaille</span><br/>
                derrière le produit.
              </h2>
              <p>
                <strong>100% pilotable.</strong> Suivez les scans en temps réel et changez<br/>
                de plateforme à tout moment sans toucher à la plaque.
              </p>
            </div>
            <div 
              className={styles.photoFrame}
              onMouseMove={handlePhotoMouseMove}
              onMouseLeave={handlePhotoMouseLeave}
            >
              <Image
                src="/linckup/router-dashboard-scene.png"
                alt="Interface Linckup avec statistiques de scans et langues"
                width={1536}
                height={1024}
                style={{ transform: 'scale(1.08)' }}
              />
            </div>
          </div>
        </div>
      </section>

      <section className={styles.scrollBand} id="fonctionnement">
        <div className={styles.shell}>
          <div className={styles.centeredBlock} ref={massiveTitleRef}>
            <h2 className={styles.massiveTitle}>
              <span className={styles.highlight}>Un seul produit,</span><br/>
              plusieurs parcours d&apos;avis.
            </h2>
            <p>
              La plaque reste la même. Le routage change selon le contexte du client,
              la langue de son téléphone et les priorités du commerce.
            </p>
            <a href="#produit" className={styles.learnMoreCentered}>En savoir plus</a>
          </div>

          <div className={styles.massiveShowcase}>
            <div 
              className={styles.wideGreenPanel}
              ref={widePanelRef}
              onMouseMove={handlePhotoMouseMove}
              onMouseLeave={handlePhotoMouseLeave}
            >
              <video
                src="/linckup/Create_a_premium_high_convert.mp4"
                autoPlay
                loop
                muted
                playsInline
                className={styles.panelVideo}
              />
            </div>
            
            <div className={styles.stepCardsGrid} ref={stepsRef}>
              {steps.map((step) => (
                <article className={styles.stepCard} key={step.title}>
                  <div className={styles.stepCardHeader}>
                    <span className={styles.checkIcon}>
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5" fill="none" />
                      </svg>
                    </span>
                    <h3>{step.title}</h3>
                  </div>
                  <p>{step.text}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={styles.faq} id="faq">
        <div className={styles.shell}>
          <h2>Questions fréquentes</h2>
          <div className={styles.faqList} ref={faqRef}>
            {faqs.map((faq) => (
              <details className={styles.faqItem} key={faq.question}>
                <summary>{faq.question}</summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>

          <div className={styles.finalShowcase} ref={finalShowcaseRef}>
            <div className={styles.finalShowcaseImage}>
              <Image
                src="/linckup/product-plaque-nobg.png"
                alt="Plaque NFC Linckup"
                width={500}
                height={500}
              />
            </div>
            <div className={styles.finalShowcaseCopy}>
              <h2>N°1 en France</h2>
              <p>
                L&apos;essayer c&apos;est l&apos;adopter : commandez la plaque Linckup pour votre comptoir
                dès maintenant pour faire décoller vos avis Google et booster votre visibilité locale.
              </p>
              <div className={styles.finalShowcaseActions}>
                <Link className={styles.finalCta} href="/fr/products/pack-linckup-comptoir">
                  Commander la plaque
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.shell}>
          <div className={styles.footerTop}>
            <Image src="/linckup/logo-cropped.png" alt="Linckup" width={160} height={40} className={styles.footerLogo} />
            <div className={styles.footerActions}>
              <a className={styles.primaryCta} href="#commander">
                Commander le pack
              </a>
            </div>
          </div>
          <div className={styles.footerBottom}>
            <span className={styles.copyright}>© {new Date().getFullYear()} Linckup. Tous droits réservés.</span>
            <div className={styles.footerLinks}>
              <a href="#produit">Produit</a>
              <a href="#fonctionnement">Routage</a>
              <Link href="/dashboard">Dashboard</Link>
              <a href="#faq">FAQ</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
