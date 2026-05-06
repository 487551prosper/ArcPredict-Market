import { useCreateMarket } from "@workspace/api-client-react";
import { useState } from "react";
import { useLocation, Link } from "wouter";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const CATEGORIES = ["Economics", "Technology", "Crypto", "Science", "Politics", "Sports", "Entertainment", "Other"];

export function CreateMarket() {
  const [, setLocation] = useLocation();
  const createMarket = useCreateMarket();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Technology");
  const [closesAt, setClosesAt] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !closesAt) {
      toast.error("Please fill in all required fields");
      return;
    }

    createMarket.mutate({
      data: {
        title: title.trim(),
        description: description.trim(),
        category,
        closesAt: new Date(closesAt).toISOString(),
        creatorId: 1,
      }
    }, {
      onSuccess: (market) => {
        toast.success("Market created successfully");
        setLocation(`/markets/${market.id}`);
      },
      onError: () => {
        toast.error("Failed to create market");
      }
    });
  };

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split("T")[0];

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in duration-500">
      <Link href="/" className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider mb-8">
        <ArrowLeft className="w-4 h-4" /> Back to Markets
      </Link>

      <div className="border border-border bg-card rounded overflow-hidden">
        <div className="h-1 bg-primary w-full" />
        <div className="p-6 md:p-8">
          <h1 className="text-xl font-bold uppercase tracking-wider mb-1">Create Market</h1>
          <p className="text-sm text-muted-foreground mb-8">Define a binary YES/NO prediction question for other users to bet on.</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground block">Question Title *</label>
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Will X happen before Y?"
                className="bg-background border-border font-sans"
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground">{title.length}/200 characters</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground block">Description *</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Provide clear resolution criteria. What exactly needs to happen for this to resolve YES? What sources will be used?"
                className="w-full bg-background border border-border rounded px-3 py-2 text-sm resize-none h-32 font-sans focus:outline-none focus:ring-1 focus:ring-ring text-foreground placeholder:text-muted-foreground"
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground">{description.length}/1000 characters</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground block">Category *</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={cn(
                      "px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider border transition-all",
                      category === cat
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground block">Closes At *</label>
              <Input
                type="date"
                value={closesAt}
                min={minDateStr}
                onChange={e => setClosesAt(e.target.value)}
                className="bg-background border-border font-mono w-48"
              />
              <p className="text-xs text-muted-foreground">Market stops accepting bets after this date.</p>
            </div>

            <div className="bg-secondary/30 border border-border rounded p-4 text-xs text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground uppercase tracking-wider text-[10px] mb-2">Market Rules</p>
              <p>Starting probability: 50% YES / 50% NO</p>
              <p>Prices shift with each bet placed</p>
              <p>You will be listed as the market creator</p>
            </div>

            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={createMarket.isPending || !title.trim() || !description.trim() || !closesAt}
                className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-bold uppercase tracking-wider"
              >
                <Plus className="w-4 h-4" />
                {createMarket.isPending ? "Creating..." : "Create Market"}
              </Button>
              <Link href="/">
                <Button type="button" variant="outline" className="font-bold uppercase tracking-wider border-border">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
