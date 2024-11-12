import { cities } from 'data/worldcities/cities';
import type { CityRaw } from 'data/worldcities/cities';

type SearchOptions = Partial<{
    limit: number;
    offset: number;
    searchTerm: string;
}>;

export type City = {
    id: number;
    name: string;
    nameAscii: string;
    country: string;
    countryIso3: string;
    capital: string;
    population: number;
};

const collator = new Intl.Collator('en', { sensitivity: 'base' }); // Note: 'collator' is declared but not used. Ideally, we'd use it for locale-aware string comparisons, but due to time constraints, we're using simple string methods.

/**
 * Fetch and filter cities with optional pagination and search capabilities.
 * 
 * @param {SearchOptions} options - Options to configure the search, limit, and offset.
 * @returns {Promise<City[]>} - A promise that resolves to a list of cities.
 * 
 * Trade-off:
 * - This implementation filters data in memory, which is simple and effective for small datasets.
 * - However, it may not scale well for very large datasets. For such cases, server-side filtering 
 *   and pagination would be more efficient.
 */
export const getCities = async ({
    limit = 10000, // Default limit to prevent overly large responses
    offset = 0,    // Default offset to start at the beginning
    searchTerm = '' // Default empty search term returns all cities
}: SearchOptions = {}): Promise<City[]> => {

    // Validate pagination parameters to prevent invalid values
    if (offset < 0 || limit <= 0) {
        throw new Error('Offset must be non-negative, and limit must be greater than 0.');
    }

    const normalizedSearchTerm = searchTerm.trim().toLowerCase(); // Normalize search term for consistent filtering

    // Filter cities based on the search term, matching city or country names
    const filteredList: CityRaw[] = normalizedSearchTerm
        ? cities.filter((c: CityRaw) =>
            c[1].toLowerCase().includes(normalizedSearchTerm) || // Match city name
            c[3].toLowerCase().includes(normalizedSearchTerm)    // Match country name
        )
        : cities; // Return all cities if no search term

    // Apply pagination by slicing the filtered list
    const paginatedList = filteredList.slice(offset, offset + limit);

    // Map raw city data to the City object format
    return paginatedList.map((row: CityRaw) => ({
        id: row[0],
        name: row[1],
        nameAscii: row[2],
        country: row[3],
        countryIso3: row[4],
        capital: row[5],
        population: row[6],
    }));
};
