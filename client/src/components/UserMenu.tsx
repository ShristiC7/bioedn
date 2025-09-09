import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, User } from "lucide-react";
import type { User as UserType } from "@shared/schema";

export function UserMenu() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return null;
  }

  const typedUser = user as UserType;

  const userInitials = typedUser.firstName && typedUser.lastName 
    ? `${typedUser.firstName[0]}${typedUser.lastName[0]}`.toUpperCase()
    : typedUser.email?.[0]?.toUpperCase() || "U";

  const displayName = typedUser.firstName && typedUser.lastName
    ? `${typedUser.firstName} ${typedUser.lastName}`
    : typedUser.email || "User";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="relative h-8 w-8 rounded-full"
          data-testid="button-user-menu"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={typedUser.profileImageUrl || ""} alt={displayName} />
            <AvatarFallback>{userInitials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <div className="flex items-center justify-start gap-2 p-2">
          <div className="flex flex-col space-y-1 leading-none">
            <p className="font-medium">{displayName}</p>
            {typedUser.email && (
              <p className="w-[200px] truncate text-sm text-muted-foreground">
                {typedUser.email}
              </p>
            )}
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => window.location.href = '/api/logout'}
          data-testid="button-logout"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}