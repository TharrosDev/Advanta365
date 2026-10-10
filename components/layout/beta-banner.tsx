import { Container } from "./container";

export function BetaBanner() {
  return (
    <div className="bg-accent text-accent-ink">
      <Container className="py-2 text-center text-sm">
        Beta preview — templates shown are samples.
      </Container>
    </div>
  );
}
