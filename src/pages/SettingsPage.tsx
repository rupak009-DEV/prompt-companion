import { useState, useEffect, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/hooks/use-auth";
import { useProfile, useUpdateProfile } from "@/hooks/use-profile";
import { countries } from "@/lib/countries";
import * as storage from "@/lib/storage";
import { toast } from "@/hooks/use-toast";
import { Download, Upload, Save, User, Loader2, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const SettingsPage = () => {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const updateProfile = useUpdateProfile();

  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState("");
  const [company, setCompany] = useState("");
  const [occupation, setOccupation] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const [countryOpen, setCountryOpen] = useState(false);
  const [phoneCodeOpen, setPhoneCodeOpen] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
      setCountry(profile.country ?? "");
      setCompany(profile.company ?? "");
      setOccupation(profile.occupation ?? "");
      setBio(profile.bio ?? "");
      setWebsite(profile.website ?? "");
      const storedPhone = profile.phone ?? "";
      if (storedPhone) {
        const match = storedPhone.match(/^(\+\d{1,4})\s*(.*)$/);
        if (match) {
          setPhoneCode(match[1]);
          setPhoneNumber(match[2]);
        } else {
          setPhoneNumber(storedPhone);
        }
      }
    }
  }, [profile]);

  const phoneError = useMemo(() => {
    if (!phoneNumber) return "";
    const cleaned = phoneNumber.replace(/[\s\-().]/g, "");
    if (!/^\d{4,15}$/.test(cleaned)) return "Enter 4–15 digits for the phone number";
    return "";
  }, [phoneNumber]);

  const websiteError = useMemo(() => {
    if (!website) return "";
    try {
      const url = new URL(website.startsWith("http") ? website : `https://${website}`);
      if (!url.hostname.includes(".")) return "Enter a valid URL (e.g. https://example.com)";
      return "";
    } catch {
      return "Enter a valid URL (e.g. https://example.com)";
    }
  }, [website]);

  const handleSaveProfile = async () => {
    if (phoneError) {
      toast({ title: phoneError, variant: "destructive" });
      return;
    }
    if (websiteError) {
      toast({ title: websiteError, variant: "destructive" });
      return;
    }
    const fullPhone = phoneNumber ? `${phoneCode} ${phoneNumber}`.trim() : null;
    try {
      await updateProfile.mutateAsync({
        full_name: fullName || null,
        country: country || null,
        company: company || null,
        occupation: occupation || null,
        bio: bio || null,
        website: website || null,
        phone: fullPhone,
      });
      toast({ title: "Profile updated!" });
    } catch {
      toast({ title: "Failed to update profile", variant: "destructive" });
    }
  };

  const handleExport = () => {
    const data = storage.exportData();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "promptforge-backup.json";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Data exported!" });
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          storage.importData(reader.result as string);
          toast({ title: "Data imported!" });
        } catch {
          toast({ title: "Invalid file", variant: "destructive" });
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const dialCodes = useMemo(() => {
    const seen = new Set<string>();
    return countries.filter((c) => {
      if (seen.has(c.dialCode)) return false;
      seen.add(c.dialCode);
      return true;
    });
  }, []);

  const selectedCountry = countries.find(c => c.name === country);
  const selectedDialCode = dialCodes.find(c => c.dialCode === phoneCode);

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-4 sm:space-y-6">
        <h1 className="text-xl sm:text-2xl font-bold">Settings</h1>

        {/* Profile Section */}
        <Card>
          <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-6">
            <CardTitle className="text-sm flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 space-y-4">
            {profileLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="text-xs text-muted-foreground">{user?.email}</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="fullName" className="text-xs">Full Name</Label>
                    <Input id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="John Doe" className="h-9 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Country</Label>
                    <Popover open={countryOpen} onOpenChange={setCountryOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" className="w-full h-9 text-sm justify-between font-normal">
                          {selectedCountry ? (
                            <span className="flex items-center gap-2">
                              <span>{selectedCountry.flag}</span>
                              <span>{selectedCountry.name}</span>
                            </span>
                          ) : "Select country"}
                          <ChevronDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[280px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search country..." />
                          <CommandList>
                            <CommandEmpty>No country found.</CommandEmpty>
                            <CommandGroup>
                              {countries.map((c) => (
                                <CommandItem
                                  key={c.code}
                                  value={`${c.name} ${c.code}`}
                                  onSelect={() => { setCountry(c.name); setCountryOpen(false); }}
                                >
                                  <Check className={cn("mr-2 h-3.5 w-3.5", country === c.name ? "opacity-100" : "opacity-0")} />
                                  <span className="mr-2">{c.flag}</span>
                                  {c.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="company" className="text-xs">Company</Label>
                    <Input id="company" value={company} onChange={e => setCompany(e.target.value)} placeholder="Acme Inc." className="h-9 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="occupation" className="text-xs">Occupation</Label>
                    <Input id="occupation" value={occupation} onChange={e => setOccupation(e.target.value)} placeholder="Software Engineer" className="h-9 text-sm" />
                  </div>
                </div>

                {/* Phone with searchable country code */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Phone Number</Label>
                  <div className="flex gap-2">
                    <Popover open={phoneCodeOpen} onOpenChange={setPhoneCodeOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" className="w-[130px] shrink-0 h-9 text-sm justify-between font-normal">
                          {selectedDialCode ? (
                            <span className="flex items-center gap-1.5">
                              <span>{selectedDialCode.flag}</span>
                              <span className="text-muted-foreground">{selectedDialCode.dialCode}</span>
                            </span>
                          ) : "Code"}
                          <ChevronDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[240px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search code or country..." />
                          <CommandList>
                            <CommandEmpty>No result found.</CommandEmpty>
                            <CommandGroup>
                              {dialCodes.map((c) => (
                                <CommandItem
                                  key={c.code}
                                  value={`${c.name} ${c.dialCode} ${c.code}`}
                                  onSelect={() => { setPhoneCode(c.dialCode); setPhoneCodeOpen(false); }}
                                >
                                  <Check className={cn("mr-2 h-3.5 w-3.5", phoneCode === c.dialCode ? "opacity-100" : "opacity-0")} />
                                  <span className="mr-2">{c.flag}</span>
                                  <span className="text-muted-foreground mr-1.5">{c.dialCode}</span>
                                  <span className="text-xs text-muted-foreground">{c.name}</span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <Input
                      value={phoneNumber}
                      onChange={e => setPhoneNumber(e.target.value)}
                      placeholder="555 123 4567"
                      className={`h-9 text-sm flex-1 ${phoneError ? "border-destructive" : ""}`}
                    />
                  </div>
                  {phoneError && <p className="text-xs text-destructive">{phoneError}</p>}
                </div>

                {/* Website with validation */}
                <div className="space-y-1.5">
                  <Label htmlFor="website" className="text-xs">Website</Label>
                  <Input
                    id="website"
                    value={website}
                    onChange={e => setWebsite(e.target.value)}
                    placeholder="https://example.com"
                    className={`h-9 text-sm ${websiteError ? "border-destructive" : ""}`}
                  />
                  {websiteError && <p className="text-xs text-destructive">{websiteError}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="bio" className="text-xs">Bio</Label>
                  <Textarea id="bio" value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell us about yourself..." className="text-sm min-h-[60px]" rows={3} />
                </div>
                <Button size="sm" onClick={handleSaveProfile} disabled={updateProfile.isPending} className="gap-1.5 text-xs h-8">
                  {updateProfile.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Save Profile
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-6">
            <CardTitle className="text-sm">Appearance</CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <ThemeToggle />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-6">
            <CardTitle className="text-sm">Data</CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5 text-xs h-8 w-full sm:w-auto">
              <Download className="h-3.5 w-3.5" />
              Export Data
            </Button>
            <Button variant="outline" size="sm" onClick={handleImport} className="gap-1.5 text-xs h-8 w-full sm:w-auto">
              <Upload className="h-3.5 w-3.5" />
              Import Data
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;
