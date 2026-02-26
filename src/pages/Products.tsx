import { useState } from "react";
import ProductCard from "@/components/ProductCard";
import { BirthdayBonusAlert } from "@/components/BirthdayBonusAlert";
import { mockProducts, categories, conditions } from "@/lib/mockData";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, SlidersHorizontal } from "lucide-react";

const Products = () => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [condition, setCondition] = useState("All");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = mockProducts.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All" || p.category === category;
    const matchCond = condition === "All" || p.condition === condition;
    return matchSearch && matchCat && matchCond;
  });

  return (
    <div className="min-h-screen py-8">
      <BirthdayBonusAlert />
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-2">Shop Pre-Loved</h1>
          <p className="text-muted-foreground">Discover unique finds at great prices</p>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium hover:bg-muted transition-colors"
          >
            <SlidersHorizontal className="h-4 w-4" /> Filters
          </button>
        </div>

        {showFilters && (
          <div className="mb-6 p-4 bg-card rounded-xl border animate-fade-in space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Category</p>
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => (
                  <Badge
                    key={c}
                    variant={category === c ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setCategory(c)}
                  >
                    {c}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Condition</p>
              <div className="flex flex-wrap gap-2">
                {conditions.map((c) => (
                  <Badge
                    key={c}
                    variant={condition === c ? "default" : "outline"}
                    className="cursor-pointer capitalize"
                    onClick={() => setCondition(c)}
                  >
                    {c}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        <p className="text-sm text-muted-foreground mb-4">{filtered.length} items found</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filtered.map((p) => (
            <ProductCard key={p.id} {...p} />
          ))}
        </div>
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-20">No products match your filters.</p>
        )}
      </div>
    </div>
  );
};

export default Products;
