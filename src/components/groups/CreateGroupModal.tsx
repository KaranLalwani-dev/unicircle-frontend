import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { tagsApi, groupApi } from "@/lib/api";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateGroupModal({ open, onClose, onCreated }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: tags = [] } = useQuery({
    queryKey: ["tags"],
    queryFn: tagsApi.getTags,
    enabled: open
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => groupApi.createGroup(data),
    onSuccess: () => {
       toast({ title: "Group created!", description: "Your group is now visible on Discover." });
       setTitle(""); setDescription(""); setDatetime(""); setMaxMembers(4); setSelectedTags([]);
       onCreated();
       onClose();
    },
    onError: (e: any) => {
       toast({ title: "Error", description: e.message || "Failed to create group", variant: "destructive" });
    }
  });

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [datetime, setDatetime] = useState("");
  const [maxMembers, setMaxMembers] = useState(4);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const toggleTag = (id: number) => {
    setSelectedTags((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (title.trim().length < 10) e.title = "Title must be at least 10 characters.";
    if (title.trim().length > 200) e.title = "Title must be under 200 characters.";
    if (description.trim().length < 20) e.description = "Description must be at least 20 characters.";
    if (description.trim().length > 2000) e.description = "Description must be under 2000 characters.";
    if (!datetime) e.datetime = "Please select a date and time.";
    else if (new Date(datetime) <= new Date()) e.datetime = "Activity must be in the future.";
    if (maxMembers < 2 || maxMembers > 20) e.maxMembers = "Members must be between 2 and 20.";
    if (selectedTags.length === 0 && tags.length > 0) e.tags = "Select at least one tag.";
    if (selectedTags.length > 5) e.tags = "You format at most 5 tags.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !validate()) return;
    
    // Combine datetime with a timezone or proper ISO string for Spring Boot
    const dt = new Date(datetime);
    
    createMutation.mutate({
      title: title.trim(),
      description: description.trim(),
      activityDateTime: dt.toISOString(),
      maxMembers: maxMembers,
      tagIds: selectedTags,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (!o && !createMutation.isPending) && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Group</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Title *</Label>
            <Input placeholder="e.g., Cab Share to Airport" value={title} onChange={(e) => setTitle(e.target.value)} disabled={createMutation.isPending}/>
            {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Description *</Label>
            <Textarea placeholder="Describe the activity, meeting point, costs..." rows={4} value={description} onChange={(e) => setDescription(e.target.value)} disabled={createMutation.isPending} />
            {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Activity Date & Time *</Label>
            <Input type="datetime-local" value={datetime} onChange={(e) => setDatetime(e.target.value)} disabled={createMutation.isPending} />
            {errors.datetime && <p className="text-xs text-destructive">{errors.datetime}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Max Members (2-20) *</Label>
            <Input type="number" min={2} max={20} value={maxMembers} onChange={(e) => setMaxMembers(parseInt(e.target.value) || 2)} disabled={createMutation.isPending} />
            {errors.maxMembers && <p className="text-xs text-destructive">{errors.maxMembers}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Tags *</Label>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag: any) => (
                <label key={tag.tagId} className="flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground" data-selected={selectedTags.includes(tag.tagId)}>
                  <Checkbox checked={selectedTags.includes(tag.tagId)} onCheckedChange={() => toggleTag(tag.tagId)} className="hidden" disabled={createMutation.isPending} />
                  {tag.name}
                </label>
              ))}
            </div>
            {errors.tags && <p className="text-xs text-destructive">{errors.tags}</p>}
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={createMutation.isPending}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Group"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
