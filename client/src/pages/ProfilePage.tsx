import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { User, Shield, Key, Settings, LogOut, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: "Security Admin",
    email: "admin@walletgyde.com",
    role: "Security Administrator",
    department: "Information Security",
    lastLogin: new Date().toISOString(),
    createdAt: "2024-01-15T10:00:00Z"
  });
  const { toast } = useToast();

  const handleSave = () => {
    setIsEditing(false);
    toast({
      title: "Profile updated",
      description: "Your profile information has been saved successfully.",
    });
  };

  const handleLogout = () => {
    toast({
      title: "Logging out",
      description: "You will be redirected to the login page.",
    });
    // In a real app, this would handle logout logic
    setTimeout(() => {
      window.location.href = "/login";
    }, 1000);
  };

  const permissions = [
    "View Security Dashboard",
    "Manage Compliance Rules",
    "Access LLM Risk Control",
    "View Security Alerts",
    "Manage User Accounts",
    "Export Security Reports",
    "Configure API Monitoring",
    "Access Audit Logs"
  ];

  return (
    <div className="min-h-screen bg-background p-6" data-testid="profile-page">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary flex items-center gap-3">
              <User className="h-8 w-8" />
              User Profile
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage your account settings and security preferences
            </p>
          </div>
          
          <Button
            onClick={handleLogout}
            variant="outline"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            data-testid="logout-button"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Your basic account information and contact details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Personal Details</h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditing(!isEditing)}
                  data-testid="edit-profile-button"
                >
                  {isEditing ? "Cancel" : "Edit"}
                </Button>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  {isEditing ? (
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) => setProfile({...profile, name: e.target.value})}
                      data-testid="input-name"
                    />
                  ) : (
                    <p className="text-sm font-medium mt-1">{profile.name}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email">Email Address</Label>
                  {isEditing ? (
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({...profile, email: e.target.value})}
                      data-testid="input-email"
                    />
                  ) : (
                    <p className="text-sm font-medium mt-1">{profile.email}</p>
                  )}
                </div>

                <div>
                  <Label>Role</Label>
                  <p className="text-sm font-medium mt-1">{profile.role}</p>
                </div>

                <div>
                  <Label>Department</Label>
                  <p className="text-sm font-medium mt-1">{profile.department}</p>
                </div>
              </div>

              {isEditing && (
                <Button onClick={handleSave} className="w-full" data-testid="save-profile-button">
                  Save Changes
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Security Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security & Access
              </CardTitle>
              <CardDescription>
                Your security credentials and access information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <Label>Last Login</Label>
                  <p className="text-sm font-medium mt-1">
                    {new Date(profile.lastLogin).toLocaleString()}
                  </p>
                </div>

                <div>
                  <Label>Account Created</Label>
                  <p className="text-sm font-medium mt-1">
                    {new Date(profile.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div>
                  <Label>Security Status</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium text-green-600">Active & Secure</span>
                  </div>
                </div>

                <div>
                  <Label>Two-Factor Authentication</Label>
                  <div className="flex items-center justify-between mt-1">
                    <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                    <Button size="sm" variant="outline" data-testid="manage-2fa-button">
                      <Key className="h-4 w-4 mr-2" />
                      Manage
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Permissions */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Permissions & Access Rights
              </CardTitle>
              <CardDescription>
                Your current permissions within the WalletGyde Security Agent
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 md:grid-cols-2">
                {permissions.map((permission, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 rounded-lg bg-green-50 border border-green-200"
                    data-testid={`permission-${index}`}
                  >
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm font-medium text-green-800">{permission}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}