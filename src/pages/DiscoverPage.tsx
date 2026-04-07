import { useState, useCallback } from "react";
import { Search, Plus, SlidersHorizontal, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { groupApi, tagsApi, utilsApi } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Group } from "@/types";
import GroupCard from "@/components/groups/GroupCard";
import GroupDetailsModal from "@/components/groups/GroupDetailsModal";
import CreateGroupModal from "@/components/groups/CreateGroupModal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const BRANCHES = ["All", "CSE", "AI", "DS", "CYS", "IT", "ECE", "ME", "CE", "EE"];

const formatYear = (val: string) => {
  if (!val) return val;
  if (val === "All") return val;
  switch (val.toUpperCase()) {
    case "FIRST_YEAR": return "1st Year";
    case "SECOND_YEAR": return "2nd Year";
    case "THIRD_YEAR": return "3rd Year";
    case "FOURTH_YEAR": return "4th Year";
    default: return val;
  }
};

export default function DiscoverPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [year, setYear] = useState("All");
  const [branch, setBranch] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [detailGroup, setDetailGroup] = useState<Group | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const { data: years = [] } = useQuery({
    queryKey: ["years"],
    queryFn: utilsApi.getYears
  });

  const { data: tags = [] } = useQuery({
    queryKey: ["tags"],
    queryFn: tagsApi.getTags
  });

  const { data: searchResponse, isLoading } = useQuery({
    queryKey: ["groups", search, selectedTagIds, year, branch],
    queryFn: () => groupApi.searchGroups({
      keyword: search || undefined,
      tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
      creatorYear: year !== "All" ? year.toUpperCase() : undefined,
      creatorBranch: branch !== "All" ? branch.toUpperCase() : undefined
    }),
    enabled: !!user
  });

  const groups = searchResponse?.content || [];

  const joinMutation = useMutation({
    mutationFn: (id: number) => groupApi.joinGroup(id),
    onSuccess: () => {
      toast({ title: "Request sent!", description: "The group creator will review your request." });
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
    onError: (e: any) => {
      toast({ title: "Cannot join", description: e.message || "Failed to join group", variant: "destructive" });
    }
  });

  const toggleTag = (id: number) => {
    setSelectedTagIds((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  };

  const clearFilters = () => { setSelectedTagIds([]); setYear("All"); setBranch("All"); setSearch(""); };

  const handleRequestJoin = useCallback((groupId: number) => {
    joinMutation.mutate(groupId);
  }, [joinMutation]);

  const hasFilters = selectedTagIds.length > 0 || year !== "All" || branch !== "All";

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 pb-24 md:pb-6">
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search groups (e.g., airport, DBMS, trek)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 pr-10"
        />
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground"
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="mb-4 space-y-3 rounded-xl border bg-card p-4">
          <div>
            <p className="mb-2 text-sm font-medium text-foreground">Tags</p>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <button
                  key={tag.tagId}
                  onClick={() => toggleTag(tag.tagId)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    selectedTagIds.includes(tag.tagId)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="min-w-[140px]">
              <p className="mb-1 text-xs text-muted-foreground">Year</p>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  {years.map((y) => <SelectItem key={y} value={y}>{formatYear(y)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[140px]">
              <p className="mb-1 text-xs text-muted-foreground">Branch</p>
              <Select value={branch} onValueChange={setBranch}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BRANCHES.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
              <X className="mr-1 h-3 w-3" /> Clear filters
            </Button>
          )}
        </div>
      )}

      {/* Results */}
      {isLoading ? (
        <div className="py-20 text-center">
            <p className="text-lg font-medium text-muted-foreground">Loading groups...</p>
        </div>
      ) : groups.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-lg font-medium text-muted-foreground">No groups found</p>
          <p className="text-sm text-muted-foreground">Try different filters or create a new group!</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => (
            <GroupCard
              key={g.groupId}
              group={g as any}
              onViewDetails={(g) => setDetailGroup(g as any)}
              onRequestJoin={handleRequestJoin}
            />
          ))}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setShowCreate(true)}
        className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg transition-transform hover:scale-105 active:scale-95 md:bottom-6"
      >
        <Plus className="h-6 w-6 text-primary-foreground" />
      </button>

      {detailGroup && <GroupDetailsModal group={detailGroup as any} open={!!detailGroup} onClose={() => setDetailGroup(null)} onRequestJoin={handleRequestJoin} />}
      <CreateGroupModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={() => queryClient.invalidateQueries({ queryKey: ["groups"] })} />
    </div>
  );
}
