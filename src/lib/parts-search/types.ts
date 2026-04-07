export interface SearchParams {
  query: string;
  make: string;
  model: string;
  year: number;
  condition: "all" | "new" | "used";
  minPrice?: number;
  maxPrice?: number;
}

export interface SearchResultItem {
  title: string;
  price: number | null;
  currency: string;
  condition: "new" | "used" | "unknown";
  url: string;
  imageUrl: string | null;
  seller: string | null;
}

export interface PlatformAdapter {
  id: string;
  label: string;
  search(params: SearchParams): Promise<SearchResultItem[]>;
}
