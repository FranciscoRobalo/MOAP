import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { Features } from "@/components/features"
import { HowItWorks } from "@/components/how-it-works"
import { ReportLegend } from "@/components/report-legend"
import { UploadSection } from "@/components/upload-section"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <Hero />
      <Features />
      <HowItWorks />
      <ReportLegend />
      <UploadSection />
      <Footer />
    </main>
  )
}
