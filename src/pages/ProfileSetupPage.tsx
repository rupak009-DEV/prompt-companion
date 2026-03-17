import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/hooks/use-auth";
import { useUpdateProfile } from "@/hooks/use-profile";
import { countries } from "@/lib/countries";
import { toast } from "@/hooks/use-toast";
import { Loader2, User, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProfileSetupPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const updateProfile = useUpdateProfile();

  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || "");
  const [country, setCountry] = useState("");
  const [company, setCompany] = useState("");
  const [occupation, setOccupation] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const [countryOpen, setCountryOpen] = useState(false);
  const [phoneCodeOpen, setPhoneCodeOpen] = useState(false);

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

  const handleSave = async () => {
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
      toast({ title: "Profile set up successfully!" });
      navigate("/app");
    } catch {
      toast({ title: "Failed to save profile", variant: "destructive" });
    }
  };

  const handleSkip = () => {
    navigate("/app");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <User className="h-10 w-10 mx-auto text-primary mb-2" />
          <CardTitle>Complete Your Profile</CardTitle>
          <CardDescription>Tell us a bit about yourself. You can always update this later.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-xs text-muted-foreground text-center">{user?.email}</div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Full Name</Label>
              <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="John Doe" className="h-9 text-sm" />
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
              <Label className="text-xs">Company</Label>
              <Input value={company} onChange={e => setCompany(e.target.value)} placeholder="Acme Inc." className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Occupation</Label>
              <Input value={occupation} onChange={e => setOccupation(e.target.value)} placeholder="Software Engineer" className="h-9 text-sm" />
            </div>
          </div>

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
                className="h-9 text-sm flex-1"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Website</Label>
            <Input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://example.com" className="h-9 text-sm" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Bio</Label>
            <Textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell us about yourself..." className="text-sm min-h-[60px]" rows={3} />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={handleSkip} className="flex-1">
              Skip for now
            </Button>
            <Button onClick={handleSave} disabled={updateProfile.isPending} className="flex-1">
              {updateProfile.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save & Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
