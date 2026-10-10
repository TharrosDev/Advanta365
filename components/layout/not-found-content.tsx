import { Button } from "@/components/ui/button";
import { Container } from "./container";

export function NotFoundContent() {
  return (
    <Container className="py-24 text-center">
      <p className="text-accent text-sm font-medium">404</p>
      <h1 className="mt-3 text-4xl font-semibold">Page not found</h1>
      <p className="text-muted mx-auto mt-4 max-w-md">
        The page you are looking for does not exist or has moved.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button href="/">Go to home</Button>
        <Button href="/catalog" variant="secondary">
          Browse the catalog
        </Button>
      </div>
    </Container>
  );
}
