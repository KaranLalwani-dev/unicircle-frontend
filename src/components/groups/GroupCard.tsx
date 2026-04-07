import { format } from "date-fns";
import { Calendar, Users, User } from "lucide-react";
import type { Group } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
  group: Group;
  onViewDetails: (group: Group) => void;
  onRequestJoin: (groupId: number) => void;
}

export default function GroupCard({ group, onViewDetails, onRequestJoin }: Props) {
  const { isCreator, isMember, hasPendingRequest, creator } = group;

  const s = group.status.toUpperCase();
  const statusColor = s === "OPEN" ? "bg-success/10 text-success" : s === "FULL" ? "bg-info/10 text-info" : "bg-muted text-muted-foreground";

  let actionLabel = "Request to Join";
  let actionDisabled = false;
  if (isCreator) { actionLabel = "Your Group"; actionDisabled = true; }
  else if (isMember) { actionLabel = "Joined"; actionDisabled = true; }
  else if (hasPendingRequest) { actionLabel = "Request Pending"; actionDisabled = true; }
  else if (s !== "OPEN") { actionLabel = s === "FULL" ? "Group Full" : group.status.toLowerCase(); actionDisabled = true; }

  return (
    <div className="group flex flex-col rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {group.tags?.map((tag) => (
            <Badge key={tag.tagId} variant="secondary" className="text-xs font-normal">
              {tag.name}
            </Badge>
          ))}
        </div>
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusColor}`}>
          {group.status.toLowerCase()}
        </span>
      </div>

      <h3 className="mb-2 text-lg font-semibold leading-tight text-foreground line-clamp-2">
        {group.title}
      </h3>

      <p className="mb-4 flex-1 text-sm leading-relaxed text-muted-foreground line-clamp-3">
        {group.description}
      </p>

      <div className="mb-4 space-y-1.5 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5" />
          <span>{format(new Date(group.activityDateTime), "MMM dd, yyyy • h:mm a")}</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-3.5 w-3.5" />
          <span>{group.currentMembers}/{group.maxMembers} members</span>
        </div>
        {creator && (
          <div className="flex items-center gap-2">
            <User className="h-3.5 w-3.5" />
            <span>{creator.name} • {formatYear(creator.year)} {creator.branch}</span>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={() => onViewDetails(group)}>
          View Details
        </Button>
        <Button
          size="sm"
          className="flex-1"
          disabled={actionDisabled}
          onClick={() => onRequestJoin(group.groupId)}
        >
          {actionLabel}
        </Button>
      </div>
    </div>
  );
}
