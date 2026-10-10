import { Container } from "@/components/layout/container";
import { SITE } from "@/lib/site";

export default function Home() {
  return (
    <Container className="py-24">
      <h1 className="text-4xl font-semibold">{SITE.tagline}</h1>
    </Container>
  );
}
