import { format } from "date-fns";
import { Calendar, Users, Phone, Instagram } from "lucide-react";
import type { Group } from "@/types";
import { groupApi } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

const formatYear = (val: string) => {
  switch (val) {
    case "FIRST_YEAR": return "1st Year";
    case "SECOND_YEAR": return "2nd Year";
    case "THIRD_YEAR": return "3rd Year";
    case "FOURTH_YEAR": return "4th Year";
    default: return val;
  }
};

interface Props {
  group: Group | null;
  open: boolean;
  onClose: () => void;
  onRequestJoin: (groupId: number) => void;
}

export default function GroupDetailsModal({ group: initialGroup, open, onClose, onRequestJoin }: Props) {
  const { data: groupDetail, isLoading } = useQuery({
    queryKey: ["groupDetails", initialGroup?.groupId],
    queryFn: () => groupApi.getGroupDetails(initialGroup!.groupId),
    enabled: !!initialGroup?.groupId && open,
  });

  const group = groupDetail || initialGroup;

  if (!group) return null;

  const { isCreator, isMember, hasPendingRequest, creator, members = [] } = group as any;
  const s = group.status.toUpperCase();
  const statusColor = s === "OPEN" ? "bg-success/10 text-success" : s === "FULL" ? "bg-info/10 text-info" : "bg-muted text-muted-foreground";

  let actionLabel = "Request to Join";
  let actionDisabled = false;
  if (isCreator) { actionLabel = "Your Group"; actionDisabled = true; }
  else if (isMember) { actionLabel = "Joined"; actionDisabled = true; }
  else if (hasPendingRequest) { actionLabel = "Request Pending"; actionDisabled = true; }
  else if (s !== "OPEN") { actionLabel = s === "FULL" ? "Group Full" : group.status.toLowerCase(); actionDisabled = true; }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {group.tags?.map((tag: any) => (
              <Badge key={tag.tagId} variant="secondary" className="text-xs">{tag.name}</Badge>
            ))}
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusColor}`}>
              {group.status.toLowerCase()}
            </span>
          </div>
          <DialogTitle className="text-xl leading-tight">{group.title}</DialogTitle>
        </DialogHeader>

        {isLoading && !groupDetail ? (
           <p className="py-8 text-center text-muted-foreground">Loading details...</p>
        ) : (
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-muted-foreground">{group.description}</p>

            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {format(new Date(group.activityDateTime), "MMM dd, yyyy • h:mm a")}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                {group.currentMembers}/{group.maxMembers} members
              </div>
            </div>

            <Separator />

            {creator && (
              <div>
                <h4 className="mb-2 text-sm font-semibold text-foreground">Created by</h4>
                <div className="rounded-lg border bg-muted/30 p-3 space-y-1 text-sm">
                  <p className="font-medium text-foreground">{creator.name}</p>
                  <p className="text-muted-foreground">{formatYear(creator.year)} • {creator.branch}</p>
                  {creator.phoneNumber && (
                    <p className="flex items-center gap-1.5 text-muted-foreground">
                      <Phone className="h-3.5 w-3.5" /> {creator.phoneNumber}
                    </p>
                  )}
                  {creator.instagramId && (
                    <p className="flex items-center gap-1.5 text-muted-foreground">
                      <Instagram className="h-3.5 w-3.5" /> @{creator.instagramId}
                    </p>
                  )}
                </div>
              </div>
            )}

            {members.length > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-semibold text-foreground">Members ({members.length})</h4>
                <div className="space-y-2">
                  {members.map((m: any) => (
                    <div key={m.userId} className="flex items-center gap-2 text-sm">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                        {m.name.split(" ").map((n: string) => n[0]).join("")}
                      </div>
                      <span className="text-foreground">{m.name}</span>
                      <span className="text-muted-foreground">• {formatYear(m.year)} {m.branch}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button
              className="w-full"
              disabled={actionDisabled}
              onClick={() => { onRequestJoin(group.groupId); onClose(); }}
            >
              {actionLabel}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
