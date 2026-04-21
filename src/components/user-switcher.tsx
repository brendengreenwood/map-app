import { useState } from 'react';
import { ChevronsUpDown, Plus, Pencil, Trash2 } from 'lucide-react';
import { useUsers } from '@/hooks/use-users';
import type { UserType } from '@/hooks/use-users';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SidebarMenuButton } from '@/components/ui/sidebar';

const AVATAR_COLORS = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-violet-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-pink-500',
  'bg-teal-500',
];

function getColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

const TYPE_CONFIG: Record<UserType, { label: string; abbr: string; color: string }> = {
  admin: { label: 'Admin', abbr: 'A', color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
  merchant: { label: 'Merchant', abbr: 'M', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  originator: { label: 'Originator', abbr: 'O', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' },
};

function TypeBadges({ types, full = false }: { types: UserType[]; full?: boolean }) {
  if (types.length === 0) return null;
  return (
    <span className="flex gap-1">
      {types.map((t) => (
        <Badge key={t} variant="outline" className={cn("border-0 px-1.5 py-0 text-[10px] font-medium leading-relaxed", TYPE_CONFIG[t].color)}>
          {full ? TYPE_CONFIG[t].label : TYPE_CONFIG[t].abbr}
        </Badge>
      ))}
    </span>
  );
}

const ALL_TYPES: UserType[] = ['admin', 'merchant', 'originator'];

export function UserSwitcher() {
  const { users, activeUser, switchUser, addUser, deleteUser, editUser } = useUsers();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formTypes, setFormTypes] = useState<UserType[]>([]);

  const toggleFormType = (type: UserType) => {
    setFormTypes((prev) => prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]);
  };

  const openAdd = () => {
    setPopoverOpen(false);
    setFormName('');
    setFormTypes([]);
    setDialogMode('add');
  };

  const openEdit = (user: { id: string; name: string; types: UserType[] }) => {
    setPopoverOpen(false);
    setEditingId(user.id);
    setFormName(user.name);
    setFormTypes([...user.types]);
    setDialogMode('edit');
  };

  const handleSave = () => {
    const trimmed = formName.trim();
    if (!trimmed) return;
    if (dialogMode === 'add') {
      addUser(trimmed, formTypes);
    } else if (dialogMode === 'edit' && editingId) {
      editUser(editingId, { name: trimmed, types: formTypes });
    }
    setDialogMode(null);
    setEditingId(null);
  };

  const handleSelect = (userId: string) => {
    switchUser(userId);
    setPopoverOpen(false);
  };

  const handleDelete = (userId: string) => {
    deleteUser(userId);
  };

  // Group users by type for display
  const admins = users.filter((u) => u.types.includes('admin'));
  const merchants = users.filter((u) => u.types.includes('merchant'));
  const originators = users.filter((u) => u.types.includes('originator'));
  const untyped = users.filter((u) => u.types.length === 0);

  return (
    <>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <SidebarMenuButton
            size="lg"
            tooltip={activeUser.name}
            className="data-[state=open]:bg-sidebar-accent"
          >
            <Avatar size="sm">
              <AvatarFallback className={cn(getColor(activeUser.id), "text-white text-[10px]")}>
                {getInitials(activeUser.name)}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="flex items-center gap-1.5 truncate font-medium">
                {activeUser.name}
                <TypeBadges types={activeUser.types} />
              </span>
            </div>
            <ChevronsUpDown className="ml-auto" />
          </SidebarMenuButton>
        </PopoverTrigger>
        <PopoverContent
          className="w-64 p-0"
          align="start"
          side="top"
          sideOffset={8}
        >
          <Command>
            <CommandInput placeholder="Search users..." />
            <CommandList>
              <CommandEmpty>No users found.</CommandEmpty>
              {admins.length > 0 && (
                <CommandGroup heading="Admins">
                  {admins.map((user) => (
                    <UserCommandItem
                      key={user.id}
                      user={user}
                      isActive={user.id === activeUser.id}
                      onSelect={handleSelect}
                      onEdit={openEdit}
                      onDelete={users.length > 1 ? handleDelete : undefined}
                    />
                  ))}
                </CommandGroup>
              )}
              {merchants.length > 0 && (
                <CommandGroup heading="Merchants">
                  {merchants.map((user) => (
                    <UserCommandItem
                      key={user.id}
                      user={user}
                      isActive={user.id === activeUser.id}
                      onSelect={handleSelect}
                      onEdit={openEdit}
                      onDelete={users.length > 1 ? handleDelete : undefined}
                    />
                  ))}
                </CommandGroup>
              )}
              {originators.length > 0 && (
                <CommandGroup heading="Originators">
                  {originators.map((user) => (
                    <UserCommandItem
                      key={user.id}
                      user={user}
                      isActive={user.id === activeUser.id}
                      onSelect={handleSelect}
                      onEdit={openEdit}
                      onDelete={users.length > 1 ? handleDelete : undefined}
                    />
                  ))}
                </CommandGroup>
              )}
              {untyped.length > 0 && (
                <CommandGroup heading="Other">
                  {untyped.map((user) => (
                    <UserCommandItem
                      key={user.id}
                      user={user}
                      isActive={user.id === activeUser.id}
                      onSelect={handleSelect}
                      onEdit={openEdit}
                      onDelete={users.length > 1 ? handleDelete : undefined}
                    />
                  ))}
                </CommandGroup>
              )}
              <CommandSeparator />
              <CommandGroup>
                <CommandItem onSelect={openAdd}>
                  <Plus data-icon="inline-start" />
                  Add User
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Add / Edit dialog */}
      <Dialog open={dialogMode !== null} onOpenChange={(open) => { if (!open) { setDialogMode(null); setEditingId(null); } }}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>{dialogMode === 'add' ? 'Add User' : 'Edit User'}</DialogTitle>
            <DialogDescription className="sr-only">
              {dialogMode === 'add' ? 'Create a new user account' : 'Edit user details'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Input
              placeholder="Name"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              autoFocus
            />
            <div className="flex gap-1.5">
              {ALL_TYPES.map((type) => (
                <Button
                  key={type}
                  variant={formTypes.includes(type) ? 'default' : 'outline'}
                  size="sm"
                  className="h-7 text-xs capitalize"
                  onClick={() => toggleFormType(type)}
                >
                  {type}
                </Button>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => { setDialogMode(null); setEditingId(null); }}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={!formName.trim()}>
                {dialogMode === 'add' ? 'Add' : 'Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function UserCommandItem({
  user,
  isActive,
  onSelect,
  onEdit,
  onDelete,
}: {
  user: { id: string; name: string; types: UserType[] };
  isActive: boolean;
  onSelect: (id: string) => void;
  onEdit: (user: { id: string; name: string; types: UserType[] }) => void;
  onDelete?: (id: string) => void;
}) {
  return (
    <CommandItem
      value={user.name}
      onSelect={() => onSelect(user.id)}
      data-checked={isActive}
      className="group/user"
    >
      <Avatar size="sm">
        <AvatarFallback className={cn(getColor(user.id), "text-white text-[10px]")}>
          {getInitials(user.name)}
        </AvatarFallback>
      </Avatar>
      <span className="truncate">{user.name}</span>
      <span className="ml-auto flex items-center gap-0.5 opacity-0 group-hover/user:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(user); }}
          className="rounded p-0.5 hover:bg-muted"
        >
          <Pencil className="size-3 text-muted-foreground" />
        </button>
        {onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(user.id); }}
            className="rounded p-0.5 hover:bg-destructive/10"
          >
            <Trash2 className="size-3 text-muted-foreground hover:text-destructive" />
          </button>
        )}
      </span>
    </CommandItem>
  );
}
