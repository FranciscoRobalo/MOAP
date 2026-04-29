import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { Features } from "@/components/features"
import { HowItWorks } from "@/components/how-it-works"
import { PlatformShowcase } from "@/components/platform-showcase"
import { ReportLegend } from "@/components/report-legend"
import { UploadSection } from "@/components/upload-section"
import { Footer } from "@/components/footer"
import { ScrollProgress } from "@/components/landing/scroll-progress"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <ScrollProgress />
      <Header />
      <Hero />
      <Features />
      <HowItWorks />
      <PlatformShowcase />
      <ReportLegend />
      <UploadSection />
      <Footer />
    </main>
  )
}
