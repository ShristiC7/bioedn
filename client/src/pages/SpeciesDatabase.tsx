import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Database } from "lucide-react";

export default function SpeciesDatabase() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8" data-testid="species-database-main">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Species Database</h2>
          <p className="text-muted-foreground">
            Comprehensive marine species catalog and identification
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Marine Species Catalog
          </CardTitle>
          <CardDescription>
            Browse and search the comprehensive species database
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Species Search & Browse</h3>
            <p>Search marine species by scientific name, common name, or conservation status</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}