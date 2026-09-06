"use client"
export const runtime = 'edge'

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { StoreHeader } from "@/components/store-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { User, Mail, Calendar, Shield } from "lucide-react"
import { toast } from "@/hooks/use-toast"

export default function ProfilePage() {
  const { user, userProfile, refreshUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [profileData, setProfileData] = useState({
    displayName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "India",
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  // Sync state when user/userProfile loads
  useEffect(() => {
    if (user || userProfile) {
      setProfileData({
        displayName: userProfile?.displayName || user?.displayName || "",
        email: userProfile?.email || user?.email || "",
        phone: userProfile?.phone || "",
        address: userProfile?.address || "",
        city: userProfile?.city || "",
        country: userProfile?.country || "India",
      })
    }
  }, [user, userProfile])

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: profileData.displayName,
          phone: profileData.phone,
          address: profileData.address,
          city: profileData.city,
          country: profileData.country,
        })
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to update profile')
      }

      await refreshUser()

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      })
    } catch (error: any) {
      console.error("Error updating profile:", error)
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "New passwords don't match",
        variant: "destructive",
      })
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        })
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to update password')
      }

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
      toast({
        title: "Password updated",
        description: "Your password has been updated successfully",
      })
    } catch (error: any) {
      console.error("Error updating password:", error)
      toast({
        title: "Update failed",
        description: error.message || "Failed to update password. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-hero">
        <StoreHeader />
        <main className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">Please log in to view your profile.</p>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  const joinedDate = userProfile?.createdAt
    ? new Date(userProfile.createdAt).toLocaleDateString()
    : "N/A"

  return (
    <div className="min-h-screen bg-gradient-hero">
      <StoreHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center animate-fade-in-up">
            <h1 className="text-4xl font-bold text-gradient-primary mb-4">My Profile</h1>
            <p className="text-muted-foreground">Manage your account settings and preferences</p>
          </div>

          {/* Profile Overview */}
          <Card className="animate-slide-up bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarFallback className="text-2xl bg-gradient-primary text-white">
                      {(userProfile?.displayName || user?.displayName || user?.email || "U").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold">{userProfile?.displayName || user?.displayName || "User"}</h2>
                  <p className="text-muted-foreground flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {userProfile?.email || user?.email}
                  </p>
                  <div className="flex items-center gap-4 mt-2">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Joined {joinedDate}
                    </Badge>
                    {userProfile?.role === "admin" && (
                      <Badge variant="default" className="flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        Admin
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Profile Information */}
            <Card className="animate-slide-up stagger-1 bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div>
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      value={profileData.displayName}
                      onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                      className="bg-background/50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" value={profileData.email} disabled className="bg-muted/50" />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      className="bg-background/50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={profileData.address}
                      onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                      className="bg-background/50"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={profileData.city}
                        onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                        className="bg-background/50"
                      />
                    </div>
                    <div>
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        value={profileData.country}
                        onChange={(e) => setProfileData({ ...profileData, country: e.target.value })}
                        className="bg-background/50"
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={loading} className="w-full bg-gradient-primary hover:opacity-90">
                    {loading ? "Updating..." : "Update Profile"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card className="animate-slide-up stagger-2 bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordUpdate} className="space-y-4">
                  <div>
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="bg-background/50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="bg-background/50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="bg-background/50"
                    />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full bg-gradient-secondary hover:opacity-90">
                    {loading ? "Updating..." : "Update Password"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}