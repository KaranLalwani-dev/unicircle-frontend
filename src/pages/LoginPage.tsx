import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Users, Mail, Lock, Eye, EyeOff, User, Phone, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

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

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [year, setYear] = useState("");
  const [branch, setBranch] = useState("");
  const [instagramId, setInstagramId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (isLogin) {
      if (!email.trim() || !password.trim()) {
        setError("Please enter both email and password.");
        return;
      }
    } else {
      if (!email.trim() || !password.trim() || !name.trim() || !year || !branch) {
        setError("Please fill out all required fields.");
        return;
      }
    }

    setLoading(true);
    try {
      if (isLogin) {
        await login({ username: email.trim(), password: password.trim() });
      } else {
        await signup({
          username: email.trim(),
          password: password.trim(),
          name: name.trim(),
          year,
          branch,
          instagramId: instagramId.trim() || undefined,
          phoneNumber: phoneNumber.trim() || undefined
        });
      }
      navigate("/discover");
    } catch (err: any) {
      if (err.status === 400) {
        setError(err.message || "Invalid input data.");
      } else if (err.status === 401) {
        setError("Invalid email or password.");
      } else {
        toast({ title: "Error", description: "A network error occurred. Please try again.", variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError("");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
            <Users className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Unicircle</h1>
          <p className="mt-2 text-muted-foreground">MIT Bengaluru — Find your crew</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{isLogin ? "Sign in" : "Sign up"}</CardTitle>
            <CardDescription>
              {isLogin ? "Enter your credentials to continue" : "Create an account to join the community"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="pl-10" placeholder="John Doe" />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1 space-y-2">
                      <Label>Year *</Label>
                      <Select value={year} onValueChange={setYear}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>{YEARS.map(y => <SelectItem key={y} value={y}>{formatYear(y)}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1 space-y-2">
                      <Label>Branch *</Label>
                      <Select value={branch} onValueChange={setBranch}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>{BRANCHES.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number (Optional)</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input id="phone" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="pl-10" placeholder="9876543210" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instagram">Instagram ID (Optional)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                      <Input id="instagram" value={instagramId} onChange={(e) => setInstagramId(e.target.value)} className="pl-10" placeholder="johndoe" />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@mit.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Please wait..." : isLogin ? "Sign in" : "Sign up"}
              </Button>
            </form>
            
            <div className="mt-4 text-center text-sm">
              <span className="text-muted-foreground">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
              </span>
              <button type="button" onClick={toggleMode} className="font-medium text-primary hover:underline">
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
