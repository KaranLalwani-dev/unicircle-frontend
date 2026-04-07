import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LogOut, Phone, Instagram, GraduationCap, BookOpen, Edit2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { userApi } from "@/lib/api";

const YEARS = ["FIRST_YEAR", "SECOND_YEAR", "THIRD_YEAR", "FOURTH_YEAR"];
const BRANCHES = ["CSE", "AI", "DS", "CYS", "IT", "ECE", "ME", "CE", "EE"];

const formatYear = (val: string) => {
  switch (val) {
    case "FIRST_YEAR": return "1st Year";
    case "SECOND_YEAR": return "2nd Year";
    case "THIRD_YEAR": return "3rd Year";
    case "FOURTH_YEAR": return "4th Year";
    default: return val;
  }
};

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [year, setYear] = useState(user?.year || "");
  const [branch, setBranch] = useState(user?.branch || "");
  const [instagramId, setInstagramId] = useState(user?.instagramId || "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || "");
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const initials = user.name.split(" ").map((n) => n[0]).join("");

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await userApi.updateProfile({
        name,
        year,
        branch,
        instagramId: instagramId || undefined,
        phoneNumber: phoneNumber || undefined
      });
      toast({ title: "Profile updated", description: "Your changes have been saved. Refreshing..." });
      setTimeout(() => window.location.reload(), 1000);
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to update profile", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-6 pb-24 md:pb-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        <Button variant="ghost" size="sm" onClick={() => setIsEditing(!isEditing)}>
          {isEditing ? <X className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
              {initials}
            </div>
            
            {!isEditing ? (
              <>
                <h2 className="text-xl font-bold text-foreground">{user.name}</h2>
                <p className="text-sm text-muted-foreground">{user.username}</p>

                <div className="mt-6 w-full space-y-3 text-left text-sm">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <GraduationCap className="h-4 w-4 shrink-0" />
                    <span>{formatYear(user.year)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <BookOpen className="h-4 w-4 shrink-0" />
                    <span>{user.branch}</span>
                  </div>
                  {user.instagramId && (
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Instagram className="h-4 w-4 shrink-0" />
                      <span>@{user.instagramId}</span>
                    </div>
                  )}
                  {user.phoneNumber && (
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Phone className="h-4 w-4 shrink-0" />
                      <span>{user.phoneNumber}</span>
                    </div>
                  )}
                </div>

                <div className="mt-6 w-full space-y-2">
                  <Button variant="destructive" className="w-full" onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" /> Sign Out
                  </Button>
                </div>
              </>
            ) : (
              <form onSubmit={handleUpdate} className="mt-4 w-full space-y-4 text-left">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="flex gap-3">
                  <div className="flex-1 space-y-2">
                    <Label>Year</Label>
                    <Select value={year} onValueChange={setYear}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {YEARS.map(y => <SelectItem key={y} value={y}>{formatYear(y)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label>Branch</Label>
                    <Select value={branch} onValueChange={setBranch}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {BRANCHES.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Instagram ID</Label>
                  <Input value={instagramId} onChange={(e) => setInstagramId(e.target.value)} />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
