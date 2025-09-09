import { storage } from "../storage";
import type { Species, InsertSpecies } from "@shared/schema";

class SpeciesService {
  private iucnApiKey: string;

  constructor() {
    this.iucnApiKey = process.env.IUCN_API_KEY || process.env.IUCN_RED_LIST_API_KEY || "";
  }

  async getSpeciesInfo(scientificName: string): Promise<Species | null> {
    try {
      // First check local database
      const existingSpecies = await storage.getSpeciesByName(scientificName);
      if (existingSpecies) {
        return existingSpecies;
      }

      // If not found locally, try IUCN Red List API
      const iucnData = await this.fetchFromIUCN(scientificName);
      
      if (iucnData) {
        // Create new species entry
        const speciesData: InsertSpecies = {
          name: iucnData.name,
          scientificName: scientificName,
          commonName: iucnData.commonName,
          category: this.determineCategory(scientificName),
          conservationStatus: iucnData.conservationStatus,
          isEndangered: this.isEndangeredStatus(iucnData.conservationStatus),
          isInvasive: false, // Would need additional invasive species database
          description: iucnData.description,
          imageUrl: iucnData.imageUrl
        };

        return await storage.createSpecies(speciesData);
      }

      return null;
    } catch (error) {
      console.error("Error getting species info:", error);
      return null;
    }
  }

  private async fetchFromIUCN(scientificName: string): Promise<any | null> {
    if (!this.iucnApiKey) {
      console.warn("IUCN API key not provided, skipping external species lookup");
      return null;
    }

    try {
      const response = await fetch(
        `https://apiv3.iucnredlist.org/api/v3/species/${encodeURIComponent(scientificName)}?token=${this.iucnApiKey}`
      );

      if (!response.ok) {
        console.warn(`IUCN API returned ${response.status} for ${scientificName}`);
        return null;
      }

      const data = await response.json();
      
      if (data.result && data.result.length > 0) {
        const species = data.result[0];
        return {
          name: species.scientific_name,
          commonName: species.main_common_name,
          conservationStatus: species.category,
          description: species.narrative,
          imageUrl: null // IUCN doesn't provide images directly
        };
      }

      return null;
    } catch (error) {
      console.error("Error fetching from IUCN API:", error);
      return null;
    }
  }

  private determineCategory(scientificName: string): string {
    // Simple heuristic to determine category based on scientific name patterns
    const name = scientificName.toLowerCase();
    
    if (name.includes('coral') || name.includes('anthozoa')) {
      return 'coral';
    } else if (name.includes('algae') || name.includes('chlorophyta') || name.includes('phaeophyta')) {
      return 'algae';
    } else if (name.includes('mollusc') || name.includes('arthropod') || name.includes('echinoderm')) {
      return 'invertebrate';
    } else {
      return 'fish'; // Default to fish for marine environments
    }
  }

  private isEndangeredStatus(status: string): boolean {
    const endangeredStatuses = ['CR', 'EN', 'VU', 'NT'];
    return endangeredStatuses.includes(status);
  }

  async getConservationAlerts(): Promise<Species[]> {
    return await storage.getEndangeredSpecies();
  }

  async getInvasiveSpeciesAlerts(): Promise<Species[]> {
    return await storage.getInvasiveSpecies();
  }

  async updateSpeciesConservationStatus(speciesId: string, status: string): Promise<void> {
    try {
      const species = await storage.getSpecies(speciesId);
      if (!species) {
        throw new Error("Species not found");
      }

      // Update conservation status and endangered flag
      const isEndangered = this.isEndangeredStatus(status);
      
      // Note: This would require adding an update method to storage
      // For now, we'll log the update
      console.log(`Updating species ${speciesId} conservation status to ${status}, endangered: ${isEndangered}`);
    } catch (error) {
      console.error("Error updating species conservation status:", error);
      throw error;
    }
  }

  async seedInitialSpecies(): Promise<void> {
    try {
      const existingSpecies = await storage.getAllSpecies();
      if (existingSpecies.length > 0) {
        console.log("Species database already seeded");
        return;
      }

      const initialSpecies: InsertSpecies[] = [
        {
          name: "Hawksbill Sea Turtle",
          scientificName: "Eretmochelys imbricata",
          commonName: "Hawksbill Turtle",
          category: "reptile",
          conservationStatus: "CR",
          isEndangered: true,
          isInvasive: false,
          description: "Critically endangered sea turtle species"
        },
        {
          name: "Lionfish",
          scientificName: "Pterois volitans",
          commonName: "Red Lionfish",
          category: "fish",
          conservationStatus: "LC",
          isEndangered: false,
          isInvasive: true,
          description: "Invasive species in Atlantic waters"
        },
        {
          name: "Staghorn Coral",
          scientificName: "Acropora cervicornis",
          commonName: "Staghorn Coral",
          category: "coral",
          conservationStatus: "CR",
          isEndangered: true,
          isInvasive: false,
          description: "Critical coral species for reef ecosystems"
        },
        {
          name: "Blue Tang",
          scientificName: "Paracanthurus hepatus",
          commonName: "Blue Tang",
          category: "fish",
          conservationStatus: "LC",
          isEndangered: false,
          isInvasive: false,
          description: "Common reef fish species"
        },
        {
          name: "Giant Kelp",
          scientificName: "Macrocystis pyrifera",
          commonName: "Giant Kelp",
          category: "algae",
          conservationStatus: "LC",
          isEndangered: false,
          isInvasive: false,
          description: "Foundation species for kelp forest ecosystems"
        }
      ];

      for (const speciesData of initialSpecies) {
        await storage.createSpecies(speciesData);
      }

      console.log(`Seeded ${initialSpecies.length} initial species`);
    } catch (error) {
      console.error("Error seeding initial species:", error);
    }
  }
}

export const speciesService = new SpeciesService();
