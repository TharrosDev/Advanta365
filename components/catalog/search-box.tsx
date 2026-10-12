import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import type { CatalogCriteria } from "@/lib/catalog/query";
import { serializeCatalogParams } from "@/lib/catalog/search-params";
import styles from "./search-box.module.css";

/**
 * The catalog search: one field with its submit button drawn inside its far end, a 44px square
 * with the magnifier whose accessible name is "Search". Enter submits as well. A plain GET form, so
 * search works without JavaScript and keeps the active filters.
 */
export function SearchBox({ criteria }: { criteria: CatalogCriteria }) {
  const kept = new URLSearchParams(serializeCatalogParams({ ...criteria, q: "", page: 1 }));

  return (
    <form action="/catalog" method="get" role="search" className={styles.form}>
      {[...kept].map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <label htmlFor="catalog-search" className="visually-hidden">
        Search templates
      </label>
      <Input
        id="catalog-search"
        type="search"
        name="q"
        defaultValue={criteria.q}
        maxLength={200}
        placeholder="Search templates, e.g. sponsor kickoff"
        className={styles.input}
      />
      <button type="submit" className={styles.submit}>
        <Icon name="search" />
        <span className="visually-hidden">Search</span>
      </button>
    </form>
  );
}
