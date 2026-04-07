import { useState } from "react";
import { format } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import { groupApi, requestApi } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Group, JoinRequest } from "@/types";
import GroupCard from "@/components/groups/GroupCard";
import GroupDetailsModal from "@/components/groups/GroupDetailsModal";
import CreateGroupModal from "@/components/groups/CreateGroupModal";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Users, Check, X, AlertTriangle, Phone, Instagram } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const formatYear = (val: string) => {
  switch (val) {
    case "FIRST_YEAR": return "1st Year";
    case "SECOND_YEAR": return "2nd Year";
    case "THIRD_YEAR": return "3rd Year";
    case "FOURTH_YEAR": return "4th Year";
    default: return val;
  }
};

export default function MyActivityPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [detailGroup, setDetailGroup] = useState<Group | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: string; id: number; label: string } | null>(null);
  const [activeTab, setActiveTab] = useState("created");

  const { data: createdGroupsResponse, isLoading: isLoadingCreated } = useQuery({
    queryKey: ["myCreatedGroups"],
    queryFn: () => groupApi.getMyGroups(),
    enabled: !!user
  });

  const { data: joinedGroupsResponse } = useQuery({
    queryKey: ["myJoinedGroups"],
    queryFn: () => groupApi.getJoinedGroups(),
    enabled: !!user
  });

  const { data: myRequestsResponse } = useQuery({
    queryKey: ["myRequests"],
    queryFn: () => requestApi.getMyRequests(),
    enabled: !!user
  });

  const { data: incomingRequestsResponse } = useQuery({
    queryKey: ["incomingRequests"],
    queryFn: () => requestApi.getRequestsForMyGroups({ status: "PENDING" }),
    enabled: !!user
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["myCreatedGroups"] });
    queryClient.invalidateQueries({ queryKey: ["myJoinedGroups"] });
    queryClient.invalidateQueries({ queryKey: ["myRequests"] });
    queryClient.invalidateQueries({ queryKey: ["incomingRequests"] });
  };

  const manageMutation = useMutation({
    mutationFn: async ({ action, id }: { action: string, id: number }) => {
      if (action === "cancel") return groupApi.cancelGroup(id);
      if (action === "leave") return groupApi.leaveGroup(id);
      if (action === "reject") return requestApi.rejectRequest(id);
      if (action === "accept") return requestApi.acceptRequest(id);
      if (action === "join") return groupApi.joinGroup(id);
    },
    onSuccess: (_, { action }) => {
      let title = "Action successful";
      if (action === "cancel") title = "Group cancelled";
      if (action === "leave") title = "You left the group";
      if (action === "reject") title = "Request rejected";
      if (action === "accept") title = "Member added to group!";
      if (action === "join") title = "Request sent!";
      toast({ title });
      invalidateAll();
      setConfirmAction(null);
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to perform action", variant: "destructive" });
      setConfirmAction(null);
    }
  });

  if (!user) return null;

  const createdGroups = createdGroupsResponse?.content || [];
  const joinedGroups = joinedGroupsResponse?.content || [];
  const myRequests = myRequestsResponse?.content || [];
  const incomingRequests = incomingRequestsResponse?.content || [];
  
  // Requirement: "badge count on the 'Requests' tab should use totalElements from the paginated response"
  const pendingCount = incomingRequestsResponse?.totalElements || 0;
  const hasCreatedGroups = createdGroups.length > 0;

  const handleConfirm = () => {
    if (!confirmAction) return;
    manageMutation.mutate({ action: confirmAction.type, id: confirmAction.id });
  };

  const statusBadge = (status: string) => {
    const s = status.toUpperCase();
    const colors: Record<string, string> = {
      OPEN: "bg-success/10 text-success",
      FULL: "bg-info/10 text-info",
      COMPLETED: "bg-muted text-muted-foreground",
      CANCELLED: "bg-destructive/10 text-destructive",
      PENDING: "bg-warning/10 text-warning",
      ACCEPTED: "bg-success/10 text-success",
      REJECTED: "bg-destructive/10 text-destructive",
    };
    return (
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${colors[s] || "bg-muted text-muted-foreground"}`}>
        {status.toLowerCase()}
      </span>
    );
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 pb-24 md:pb-6">
      <h1 className="mb-4 text-2xl font-bold text-foreground">My Activity</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4 w-full justify-start">
          <TabsTrigger value="created">Created</TabsTrigger>
          <TabsTrigger value="joined">Joined</TabsTrigger>
          <TabsTrigger value="requested">Requested</TabsTrigger>
          {hasCreatedGroups && (
            <TabsTrigger value="requests" className="relative">
              Requests
              {pendingCount > 0 && (
                <span className="ml-1.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                  {pendingCount}
                </span>
              )}
            </TabsTrigger>
          )}
        </TabsList>

        {/* Created */}
        <TabsContent value="created" className="space-y-3">
          {isLoadingCreated && <p className="py-8 text-center text-muted-foreground">Loading specific groups...</p>}
          {!isLoadingCreated && createdGroups.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-muted-foreground">You haven't created any groups yet.</p>
              <Button className="mt-4" onClick={() => setShowCreate(true)}>Create Your First Group</Button>
            </div>
          ) : (
            createdGroups.map((g) => {
              // Usually the backend returns a `pendingRequestsCount` for each group, but since it's not explicitly in the API spec snippet for GroupSummaryResponse, we'll conditionally show requests count based on another query if requested. However, since the spec says 'hasPendingRequest' is attached, we can just point to the requests tab.
              return (
                <div key={g.groupId} className="rounded-xl border bg-card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">{g.title}</h3>
                        {statusBadge(g.status)}
                      </div>
                      <p className="mb-2 text-sm text-muted-foreground line-clamp-2">{g.description}</p>
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{format(new Date(g.activityDateTime), "MMM dd, yyyy • h:mm a")}</span>
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" />{g.currentMembers}/{g.maxMembers}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => setDetailGroup(g)}>View Details</Button>
                    <Button variant="outline" size="sm" onClick={() => setActiveTab("requests")}>Manage Requests</Button>
                    {g.status === "OPEN" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => setConfirmAction({ type: "cancel", id: g.groupId, label: `Cancel "${g.title}"?` })}
                        disabled={manageMutation.isPending}
                      >
                        Cancel Group
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </TabsContent>

        {/* Joined */}
        <TabsContent value="joined">
          {joinedGroups.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-muted-foreground">You haven't joined any groups yet.</p>
              <p className="text-sm text-muted-foreground">Browse groups in the Discover tab!</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {joinedGroups.map((g) => (
                <div key={g.groupId} className="flex flex-col">
                  <GroupCard group={g as any} onViewDetails={(g) => setDetailGroup(g as any)} onRequestJoin={(id) => manageMutation.mutate({ action: "join", id })} />
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 text-destructive hover:bg-destructive/10"
                    onClick={() => setConfirmAction({ type: "leave", id: g.groupId, label: `Leave "${g.title}"?` })}
                    disabled={manageMutation.isPending}
                  >
                    Leave Group
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Requested */}
        <TabsContent value="requested" className="space-y-3">
          {myRequests.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-muted-foreground">You haven't requested to join any groups.</p>
            </div>
          ) : (
            myRequests.map((r) => (
              <div key={r.requestId} className="rounded-xl border bg-card p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">{r.groupTitle}</h3>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span>Requested: {format(new Date(r.requestedAt), "MMM dd, yyyy • h:mm a")}</span>
                      {r.activityDateTime && <span><Calendar className="mr-0.5 inline h-3 w-3" />Activity: {format(new Date(r.activityDateTime), "MMM dd, yyyy")}</span>}
                    </div>
                  </div>
                  {statusBadge(r.status)}
                </div>
              </div>
            ))
          )}
        </TabsContent>

        {/* Requests for my groups */}
        {hasCreatedGroups && (
          <TabsContent value="requests" className="space-y-3">
            {incomingRequests.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-muted-foreground">No pending requests for your groups.</p>
              </div>
            ) : (
              incomingRequests.map((r) => (
                <div key={r.requestId} className="rounded-xl border bg-card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">
                        {r.requester.name} <span className="font-normal text-muted-foreground">wants to join</span>
                      </p>
                      <p className="text-sm text-primary">"{r.groupTitle}"</p>
                      <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                        <p>{formatYear(r.requester.year)} • {r.requester.branch}</p>
                        {r.requester.phoneNumber && (
                          <p className="flex items-center gap-1"><Phone className="h-3 w-3" />{r.requester.phoneNumber}</p>
                        )}
                        {r.requester.instagramId && (
                          <p className="flex items-center gap-1"><Instagram className="h-3 w-3" />@{r.requester.instagramId}</p>
                        )}
                        <p>Requested: {format(new Date(r.requestedAt), "MMM dd • h:mm a")}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => manageMutation.mutate({ action: "accept", id: r.requestId })} disabled={manageMutation.isPending}>
                        <Check className="mr-1 h-3 w-3" /> Accept
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive"
                        onClick={() => setConfirmAction({ type: "reject", id: r.requestId, label: `Reject ${r.requester.name}'s request?` })}
                        disabled={manageMutation.isPending}
                      >
                        <X className="mr-1 h-3 w-3" /> Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        )}
      </Tabs>

      <GroupDetailsModal group={detailGroup as any} open={!!detailGroup} onClose={() => setDetailGroup(null)} onRequestJoin={(id) => manageMutation.mutate({ action: "join", id })} />
      <CreateGroupModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={invalidateAll} />

      <AlertDialog open={!!confirmAction} onOpenChange={(o) => !o && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>{confirmAction?.label}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
