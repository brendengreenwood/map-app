import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useUsers } from '@/hooks/use-users';
import type { UserType, Theme } from '@/hooks/use-users';

const USER_TYPES: { value: UserType; label: string; description: string }[] = [
  { value: 'admin', label: 'Admin', description: 'Can manage merchants, elevators, and originator assignments' },
  { value: 'merchant', label: 'Merchant', description: 'Can receive payments and manage storefronts' },
  { value: 'originator', label: 'Originator', description: 'Can create and submit transactions' },
];

export default function SettingsPage() {
  const { activeUser, updatePreferences, updateTypes } = useUsers();

  const toggleType = (type: UserType) => {
    const has = activeUser.types.includes(type);
    updateTypes(has ? activeUser.types.filter((t) => t !== type) : [...activeUser.types, type]);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Profile</CardTitle>
          <CardDescription>Set your user type. You can have multiple types.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            {USER_TYPES.map((ut) => (
              <div key={ut.value} className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-0.5">
                  <Label htmlFor={`type-${ut.value}`}>{ut.label}</Label>
                  <span className="text-xs text-muted-foreground">{ut.description}</span>
                </div>
                <Switch
                  id={`type-${ut.value}`}
                  checked={activeUser.types.includes(ut.value)}
                  onCheckedChange={() => toggleType(ut.value)}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Appearance</CardTitle>
          <CardDescription>Controls both the app UI and map style.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="theme">Theme</Label>
              <Select
                value={activeUser.preferences.theme}
                onValueChange={(v) => updatePreferences({ theme: v as Theme })}
              >
                <SelectTrigger id="theme" className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
